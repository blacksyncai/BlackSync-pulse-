import { Injectable, Logger } from '@nestjs/common';

import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { isNonEmptyString } from '@sniptt/guards';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60;

const PHONE_NUMBER_PATTERN = /^\+?[0-9]{6,15}$/;

const PLIVO_API_BASE_URL = 'https://api.plivo.com/v1/Account';
const PLIVO_APPLICATION_NAME = 'blacksync_pulse';
const PLIVO_ENDPOINT_ALIAS = 'blacksync_pulse_browser';
const PLIVO_ENDPOINT_USERNAME_PREFIX = 'pulse';

export type PlivoVoiceSetup = {
  endpointUsername: string;
  callerId: string;
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

type PlivoNumber = {
  number: string;
  voice_enabled: boolean;
  alias: string | null;
};

export type PlivoCallerId = { number: string; label: string | null };

const CALLER_IDS_CACHE_MS = 5 * 60 * 1000;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toE164 = (number: string) =>
  number.startsWith('+') ? number : `+${number}`;

@Injectable()
export class PlivoService {
  private readonly logger = new Logger(PlivoService.name);
  private voiceSetup: Promise<PlivoVoiceSetup | null> | null = null;
  private callerIdsCache: {
    expiresAt: number;
    callerIds: PlivoCallerId[];
  } | null = null;

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
    const endpointUsername = this.twentyConfigService.get(
      'PLIVO_ENDPOINT_USERNAME',
    );
    const callerId = this.twentyConfigService.get('PLIVO_CALLER_ID');

    if (isNonEmptyString(endpointUsername) && isNonEmptyString(callerId)) {
      return { endpointUsername, callerId };
    }

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

  // Same claims and headers as Plivo's own AccessToken helper (plivo npm package).
  createAccessToken(callerIdentity: string, endpointUsername: string): string {
    const authId = this.twentyConfigService.get('PLIVO_AUTH_ID');
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        jti: `${callerIdentity}-${Date.now()}`,
        iss: authId,
        sub: endpointUsername,
        nbf: nowInSeconds,
        exp: nowInSeconds + ACCESS_TOKEN_LIFETIME_SECONDS,
        grants: {
          voice: { incoming_allow: false, outgoing_allow: true },
        },
      },
      this.twentyConfigService.get('PLIVO_AUTH_TOKEN'),
      {
        header: { alg: 'HS256', typ: 'JWT', cty: 'plivo;v=1' } as jwt.JwtHeader,
      },
    );
  }

  // Voice-enabled numbers in the Plivo account that callers may present as caller ID.
  async listCallerIds(): Promise<PlivoCallerId[]> {
    if (
      this.callerIdsCache !== null &&
      this.callerIdsCache.expiresAt > Date.now()
    ) {
      return this.callerIdsCache.callerIds;
    }

    if (!this.hasCredentials()) {
      return [];
    }

    const numbers = await this.plivoRequest<PlivoList<PlivoNumber>>(
      'GET',
      '/Number/?limit=50',
    );
    const callerIds = numbers.objects
      .filter((number) => number.voice_enabled)
      .map((number) => ({
        number: toE164(number.number),
        label: isNonEmptyString(number.alias) ? number.alias : null,
      }));

    this.callerIdsCache = {
      expiresAt: Date.now() + CALLER_IDS_CACHE_MS,
      callerIds,
    };

    return callerIds;
  }

  // The browser may ask for another caller ID, but only one of the account's own numbers.
  async resolveCallerId(requestedCallerId: string | undefined) {
    const voiceSetup = await this.getVoiceSetup();

    if (!isNonEmptyString(requestedCallerId)) {
      return voiceSetup?.callerId;
    }

    const callerIds: PlivoCallerId[] = await this.listCallerIds().catch(
      () => [],
    );
    const requested = toE164(requestedCallerId.replace(/[\s()-]/g, ''));

    return callerIds.some((callerId) => callerId.number === requested)
      ? requested
      : voiceSetup?.callerId;
  }

  buildAnswerXml(
    destination: string | undefined,
    callerId: string | undefined,
    shouldRecord = false,
  ): string {
    const normalizedDestination = (destination ?? '').replace(/[\s()-]/g, '');

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

    const configuredCallerId = this.twentyConfigService.get('PLIVO_CALLER_ID');
    const callerId = isNonEmptyString(configuredCallerId)
      ? configuredCallerId
      : (
          await this.plivoRequest<PlivoList<PlivoNumber>>(
            'GET',
            '/Number/?limit=20',
          )
        ).objects.find((number) => number.voice_enabled)?.number;

    if (!isNonEmptyString(endpointUsername) || !isNonEmptyString(callerId)) {
      this.logger.warn(
        'Plivo calling needs a voice-enabled phone number in the Plivo account',
      );

      return null;
    }

    this.logger.log(`Plivo calling ready as ${endpointUsername}`);

    return { endpointUsername, callerId: toE164(callerId) };
  }

  private async plivoRequest<TResponse>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<TResponse> {
    const authId = this.twentyConfigService.get('PLIVO_AUTH_ID');
    const authToken = this.twentyConfigService.get('PLIVO_AUTH_TOKEN');
    const response = await fetch(`${PLIVO_API_BASE_URL}/${authId}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${authId}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Plivo ${method} ${path} failed with ${response.status}: ${(await response.text()).slice(0, 300)}`,
      );
    }

    return (await response.json()) as TResponse;
  }
}
