import { Injectable } from '@nestjs/common';

import * as jwt from 'jsonwebtoken';
import { isNonEmptyString } from '@sniptt/guards';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60;

const PHONE_NUMBER_PATTERN = /^\+?[0-9]{6,15}$/;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

@Injectable()
export class PlivoService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  isEnabled(): boolean {
    return [
      this.twentyConfigService.get('PLIVO_AUTH_ID'),
      this.twentyConfigService.get('PLIVO_AUTH_TOKEN'),
      this.twentyConfigService.get('PLIVO_ENDPOINT_USERNAME'),
      this.twentyConfigService.get('PLIVO_CALLER_ID'),
    ].every(isNonEmptyString);
  }

  // Same claims and headers as Plivo's own AccessToken helper (plivo npm package).
  createAccessToken(callerIdentity: string): string {
    const authId = this.twentyConfigService.get('PLIVO_AUTH_ID');
    const nowInSeconds = Math.floor(Date.now() / 1000);

    return jwt.sign(
      {
        jti: `${callerIdentity}-${Date.now()}`,
        iss: authId,
        sub: this.twentyConfigService.get('PLIVO_ENDPOINT_USERNAME'),
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

  buildAnswerXml(destination: string | undefined): string {
    const callerId = this.twentyConfigService.get('PLIVO_CALLER_ID');
    const normalizedDestination = (destination ?? '').replace(/[\s()-]/g, '');

    if (!PHONE_NUMBER_PATTERN.test(normalizedDestination)) {
      return '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup reason="rejected"/></Response>';
    }

    return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="${escapeXml(callerId)}"><Number>${escapeXml(normalizedDestination)}</Number></Dial></Response>`;
  }
}
