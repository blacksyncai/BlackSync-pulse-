import { Injectable, Logger } from '@nestjs/common';

import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { isNonEmptyString } from '@sniptt/guards';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60;

const PHONE_NUMBER_PATTERN = /^\+?[0-9]{6,15}$/;

const PLIVO_API_BASE_URL = 'https://api.plivo.com/v1/Account';
const PLIVO_APPLICATION_NAME = 'blacksync_crm_voice_v2';
const PLIVO_ENDPOINT_ALIAS = 'blacksync_crm_browser_v2';
const PLIVO_ENDPOINT_USERNAME_PREFIX = 'pulse';

export type PlivoVoiceSetup = {
  endpointUsername: string;
  callerId: string;
  applicationId?: string;
};

type PlivoList<TObject> = { objects: TObject[] };

type PlivoApplication = {
  app_id: string;
  app_name: string;
  answer_url: string;
};

type PlivoEndpoint = {
  endpoint_id: string;
  username: string;
  alias: string;
  application: string | null;
};

export type PlivoCallerId = { number: string; label: string | null };

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

@Injectable()
export class PlivoService {
  private readonly logger = new Logger(PlivoService.name);
  private voiceSetup: Promise<PlivoVoiceSetup | null> | null = null;

  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  hasCredentials(): boolean {
    return [
      this.twentyConfigService.get('PLIVO_AUTH_ID'),
      this.twentyConfigService.get('PLIVO_AUTH_TOKEN'),
    ].every(isNonEmptyString);
  }

  // Only the Auth ID and Token are required: the calling application, browser
  // endpoint and caller ID are found or created in the Plivo account on first use.
  async getVoiceSetup(): Promise<PlivoVoiceSetup | null> {
    if (!this.hasCredentials()) {
      return null;
    }

    this.voiceSetup ??= this.provisionVoiceSetup().catch((error) => {
      this.logger.error(
        'Plivo setup failed',
        error instanceof Error ? error.stack : String(error),
      );
      this.voiceSetup = null;

      return null;
    });

    return this.voiceSetup;
  }

  // Plivo's token API issues tokens its servers accept for SIP registration; the
  // locally signed token is only a fallback when that API cannot be reached.
  async createAccessToken(
    callerIdentity: string,
    voiceSetup: PlivoVoiceSetup,
  ): Promise<string> {
    const authId = this.twentyConfigService.get('PLIVO_AUTH_ID');
    const nowInSeconds = Math.floor(Date.now() / 1000);

    try {
      const response = await this.plivoRequest<{ token?: string }>(
        'POST',
        '/JWT/Token/',
        {
          iss: authId,
          sub: voiceSetup.endpointUsername,
          nbf: nowInSeconds,
          exp: nowInSeconds + ACCESS_TOKEN_LIFETIME_SECONDS,
          per: { voice: { incoming_allow: false, outgoing_allow: true } },
          ...(isNonEmptyString(voiceSetup.applicationId)
            ? { app: voiceSetup.applicationId }
            : {}),
        },
      );

      if (isNonEmptyString(response.token)) {
        return response.token;
      }

      this.logger.warn('Plivo token API returned no token, signing locally');
    } catch (error) {
      this.logger.warn(
        `Plivo token API failed, signing locally: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return jwt.sign(
      {
        jti: `${callerIdentity}-${Date.now()}`,
        iss: authId,
        sub: voiceSetup.endpointUsername,
        nbf: nowInSeconds,
        exp: nowInSeconds + ACCESS_TOKEN_LIFETIME_SECONDS,
        per: {
          voice: { incoming_allow: false, outgoing_allow: true },
        },
        ...(isNonEmptyString(voiceSetup.applicationId)
          ? { app: voiceSetup.applicationId }
          : {}),
      },
      this.twentyConfigService.get('PLIVO_AUTH_TOKEN'),
      {
        noTimestamp: true,
        header: { alg: 'HS256', typ: 'JWT', cty: 'plivo;v=1' } as jwt.JwtHeader,
      },
    );
  }

  // Recordings show up in Plivo a little after the call ends; null until then.
  async findRecordingUrl(callUuid: string): Promise<string | null> {
    const recordings = await this.plivoRequest<
      PlivoList<{ recording_url: string | null }>
    >('GET', `/Recording/?call_uuid=${encodeURIComponent(callUuid)}&limit=1`);

    return recordings.objects[0]?.recording_url ?? null;
  }

  basicAuthHeader(): Record<string, string> {
    const authId = this.twentyConfigService.get('PLIVO_AUTH_ID');
    const authToken = this.twentyConfigService.get('PLIVO_AUTH_TOKEN');

    return {
      Authorization: `Basic ${Buffer.from(`${authId}:${authToken}`).toString('base64')}`,
    };
  }

  buildAnswerXml(
    destination: string | undefined,
    callerId: string | undefined,
    shouldRecord = false,
  ): string {
    // Browser calls can arrive as a SIP URI such as sip:+14155550100@phone.plivo.com.
    const normalizedDestination = (destination ?? '')
      .replace(/^sip:/i, '')
      .replace(/@.*$/, '')
      .replace(/[\s()-]/g, '');

    if (
      !isNonEmptyString(callerId) ||
      !PHONE_NUMBER_PATTERN.test(normalizedDestination)
    ) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup reason="rejected"/></Response>';
    }

    const record = shouldRecord
      ? '<Record recordSession="true" startOnDialAnswer="true" redirect="false" maxLength="14400"/>'
      : '';

    return `<?xml version="1.0" encoding="UTF-8"?><Response>${record}<Dial callerId="${escapeXml(callerId)}"><Number>${escapeXml(normalizedDestination)}</Number></Dial></Response>`;
  }

  private async provisionVoiceSetup(): Promise<PlivoVoiceSetup | null> {
    const answerUrl = `${this.twentyConfigService.get('SERVER_URL')}/webhooks/plivo/answer`;

    const applications = await this.plivoRequest<PlivoList<PlivoApplication>>(
      'GET',
      '/Application/?limit=20',
    );
    const existingApplication = applications.objects.find(
      (application) => application.app_name === PLIVO_APPLICATION_NAME,
    );
    let applicationId = existingApplication?.app_id;

    if (applicationId === undefined) {
      const created = await this.plivoRequest<{ app_id: string }>(
        'POST',
        '/Application/',
        {
          app_name: PLIVO_APPLICATION_NAME,
          answer_url: answerUrl,
          answer_method: 'POST',
        },
      );

      applicationId = created.app_id;
    } else if (existingApplication?.answer_url !== answerUrl) {
      await this.plivoRequest('POST', `/Application/${applicationId}/`, {
        answer_url: answerUrl,
        answer_method: 'POST',
      });
    }

    const endpoints = await this.plivoRequest<PlivoList<PlivoEndpoint>>(
      'GET',
      '/Endpoint/?limit=20',
    );
    const existingEndpoint = endpoints.objects.find(
      (endpoint) => endpoint.alias === PLIVO_ENDPOINT_ALIAS,
    );
    let endpointUsername = existingEndpoint?.username;

    if (existingEndpoint === undefined) {
      const created = await this.plivoRequest<{ username: string }>(
        'POST',
        '/Endpoint/',
        {
          username: PLIVO_ENDPOINT_USERNAME_PREFIX,
          password: randomBytes(18).toString('base64url'),
          alias: PLIVO_ENDPOINT_ALIAS,
          app_id: applicationId,
        },
      );

      endpointUsername = created.username;
    } else if (!existingEndpoint.application?.includes(applicationId)) {
      await this.plivoRequest(
        'POST',
        `/Endpoint/${existingEndpoint.endpoint_id}/`,
        { app_id: applicationId },
      );
    }

    if (!isNonEmptyString(endpointUsername)) return null;

    this.logger.log(`Plivo calling ready as ${endpointUsername}`);

    return {
      endpointUsername,
      callerId: '',
      applicationId,
    };
  }

  async plivoRequest<TResponse>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<TResponse> {
    const authId = this.twentyConfigService.get('PLIVO_AUTH_ID');
    const authToken = this.twentyConfigService.get('PLIVO_AUTH_TOKEN');
    const response = await fetch(`${PLIVO_API_BASE_URL}/${authId}${path}`, {
      method,
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${authId}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      throw Object.assign(
        new Error(`Plivo request failed (${response.status}).`),
        { status: response.status },
      );
    }

    return (await response.json()) as TResponse;
  }
}
