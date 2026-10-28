import * as jwt from 'jsonwebtoken';

import { PlivoService } from 'src/engine/core-modules/plivo/services/plivo.service';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const CONFIG: Record<string, string> = {
  PLIVO_AUTH_ID: 'MAAUTHID',
  PLIVO_AUTH_TOKEN: 'secret-token',
  PLIVO_ENDPOINT_USERNAME: 'pulse-browser',
  PLIVO_CALLER_ID: '+14155550100',
};

const buildService = (config: Record<string, string> = CONFIG) =>
  new PlivoService({
    get: (key: string) => config[key],
  } as unknown as TwentyConfigService);

describe('PlivoService', () => {
  it('uses the configured endpoint and caller ID without calling Plivo', async () => {
    await expect(buildService().getVoiceSetup()).resolves.toEqual({
      endpointUsername: 'pulse-browser',
      callerId: '+14155550100',
    });
  });

  it('stays disabled without Plivo credentials', async () => {
    await expect(
      buildService({ PLIVO_AUTH_ID: '', PLIVO_AUTH_TOKEN: '' }).getVoiceSetup(),
    ).resolves.toBeNull();
  });

  it('signs an outbound-only access token for the configured endpoint', () => {
    const token = buildService().createAccessToken('user-1', 'pulse-browser');
    const decoded = jwt.verify(token, 'secret-token', {
      complete: true,
    }) as jwt.Jwt;
    const payload = decoded.payload as jwt.JwtPayload;

    expect(decoded.header.cty).toBe('plivo;v=1');
    expect(payload.iss).toBe('MAAUTHID');
    expect(payload.sub).toBe('pulse-browser');
    expect(payload.grants).toEqual({
      voice: { incoming_allow: false, outgoing_allow: true },
    });
    expect((payload.exp ?? 0) - (payload.nbf ?? 0)).toBe(3600);
  });

  it('dials the destination with the configured caller ID', () => {
    expect(
      buildService().buildAnswerXml('+1 (415) 555-0199', '+14155550100'),
    ).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Dial callerId="+14155550100"><Number>+14155550199</Number></Dial></Response>',
    );
  });

  it('hangs up instead of dialing anything that is not a phone number', () => {
    for (const destination of [undefined, 'sip:someone@example.com', '<x/>']) {
      expect(
        buildService().buildAnswerXml(destination, '+14155550100'),
      ).toContain('<Hangup reason="rejected"/>');
    }
  });

  it('records the call when asked', () => {
    expect(
      buildService().buildAnswerXml('+14155550199', '+14155550100', true),
    ).toContain('<Record recordSession="true" startOnDialAnswer="true"');
  });
});
