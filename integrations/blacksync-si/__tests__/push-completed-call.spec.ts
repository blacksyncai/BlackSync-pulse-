import { pushCompletedCall } from '../push-completed-call';
const CALL = {
  externalId: 'saved-call-123',
  phoneNumber: '+15551234567',
  direction: 'outbound' as const,
  durationSeconds: 90,
  outcome: 'answered' as const,
  personId: 'contact-id',
};
describe('blacksync.si sender', () => {
  const fetcher = jest.fn();
  const options = {
    crmBaseUrl: 'https://crm.blacksync.cloud/',
    apiKey: 'test-key',
    call: CALL,
    fetcher: fetcher as typeof fetch,
  };
  beforeEach(() => {
    jest.clearAllMocks();
    fetcher.mockResolvedValue({
      ok: true,
      json: async () => ({ noteId: 'note-id', created: true }),
    });
  });
  it('sends the saved call ID with the BlackSync source and keeps authorization in headers', async () => {
    await expect(pushCompletedCall(options)).resolves.toEqual({
      noteId: 'note-id',
      created: true,
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://crm.blacksync.cloud/rest/pulse/calls',
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      ...CALL,
      source: 'blacksync-si',
    });
  });
  it.each([
    'http://crm.blacksync.cloud',
    'https://user:pass@crm.blacksync.cloud',
    'https://crm.blacksync.cloud?token=secret',
  ])('rejects unsafe configuration %s without sending', async (crmBaseUrl) => {
    await expect(
      pushCompletedCall({ ...options, crmBaseUrl }),
    ).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('propagates a failed delivery so the calling app can retry it durably', async () => {
    fetcher.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(pushCompletedCall(options)).rejects.toThrow('(503)');
  });
  it('returns an idempotent replay as a successful delivery', async () => {
    fetcher.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ noteId: 'note-id', created: false }),
    });
    await expect(pushCompletedCall(options)).resolves.toEqual({
      noteId: 'note-id',
      created: false,
    });
  });
});
