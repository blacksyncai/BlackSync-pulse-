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
  it('creates only a dedicated CRM application and endpoint; legacy shared numbers are not used', async () => {
    const service = buildService();
    const request = jest
      .spyOn(service, 'plivoRequest')
      .mockImplementation(async (_method, path) => {
        if (path.startsWith('/Application'))
          return {
            objects: [
              {
                app_id: 'crm-app',
                app_name: 'blacksync_crm_voice_v2',
                answer_url: 'undefined/webhooks/plivo/answer',
              },
            ],
          } as never;
        if (path.startsWith('/Endpoint'))
          return {
            objects: [
              {
                endpoint_id: 'crm-endpoint',
                username: 'crm-browser',
                alias: 'blacksync_crm_browser_v2',
                application: 'crm-app',
              },
            ],
          } as never;
        throw new Error('Shared carrier numbers must not be queried');
      });
    await expect(service.getVoiceSetup()).resolves.toEqual({
      endpointUsername: 'crm-browser',
      callerId: '',
      applicationId: 'crm-app',
    });
    expect(
      request.mock.calls.some((call) => call[1].startsWith('/Number')),
    ).toBe(false);
  });

  it('stays disabled without Plivo credentials', async () => {
    await expect(
      buildService({ PLIVO_AUTH_ID: '', PLIVO_AUTH_TOKEN: '' }).getVoiceSetup(),
    ).resolves.toBeNull();
  });

  describe('createAccessToken', () => {
    const setup = {
      endpointUsername: 'pulse-browser',
      callerId: '+14155550100',
      applicationId: 'app-1',
    };

    afterEach(() => jest.restoreAllMocks());

    it("uses the token Plivo's token API issues", async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ token: 'plivo-issued' }), {
          status: 200,
        }),
      );

      await expect(
        buildService().createAccessToken('user-1', setup),
      ).resolves.toBe('plivo-issued');

      const [url, init] = fetchSpy.mock.calls[0];
      const body = JSON.parse(String((init as RequestInit).body));

      expect(String(url)).toBe(
        'https://api.plivo.com/v1/Account/MAAUTHID/JWT/Token/',
      );
      expect(body).toMatchObject({
        iss: 'MAAUTHID',
        sub: 'pulse-browser',
        app: 'app-1',
        per: { voice: { incoming_allow: false, outgoing_allow: true } },
      });
      expect(body.exp - body.nbf).toBe(3600);
    });

    it('signs an outbound-only token itself when the token API fails', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('nope', { status: 500 }));

      const token = await buildService().createAccessToken('user-1', setup);
      const decoded = jwt.verify(token, 'secret-token', {
        complete: true,
      }) as jwt.Jwt;
      const payload = decoded.payload as jwt.JwtPayload;

      expect(decoded.header.cty).toBe('plivo;v=1');
      expect(payload.sub).toBe('pulse-browser');
      expect(payload.per).toEqual({
        voice: { incoming_allow: false, outgoing_allow: true },
      });
      expect(payload.iat).toBeUndefined();
    });
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
