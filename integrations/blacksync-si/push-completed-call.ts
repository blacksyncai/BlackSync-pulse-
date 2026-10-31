export type BlackSyncCompletedCall = {
  externalId: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  outcome:
    'answered' | 'no-answer' | 'busy' | 'failed' | 'voicemail' | 'canceled';
  personId?: string;
  companyId?: string;
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
};

type PushCompletedCallOptions = {
  crmBaseUrl: string;
  apiKey: string;
  call: BlackSyncCompletedCall;
  fetcher?: typeof fetch;
};

// Run this from the calling app's backend or job worker, never a browser bundle.
export const pushCompletedCall = async ({
  crmBaseUrl,
  apiKey,
  call,
  fetcher = fetch,
}: PushCompletedCallOptions): Promise<{ noteId: string; created: boolean }> => {
  const base = new URL(crmBaseUrl);
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new Error(
      'Configure an HTTPS CRM base URL without credentials, query parameters, or a fragment.',
    );
  }
  if (!apiKey.trim()) throw new Error('Configure a BlackSync CRM API key.');
  if (!call.personId && !call.companyId)
    throw new Error('Map the call to a CRM contact or lead before pushing it.');

  const response = await fetcher(
    `${base.toString().replace(/\/+$/, '')}/rest/pulse/calls`,
    {
      method: 'POST',
      redirect: 'error',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...call, source: 'blacksync-si' }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) {
    throw new Error(
      `BlackSync CRM rejected the call (${response.status}). Check the record mapping, API key, and role permissions.`,
    );
  }
  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== 'object' ||
    !('noteId' in result) ||
    typeof result.noteId !== 'string' ||
    !('created' in result) ||
    typeof result.created !== 'boolean'
  ) {
    throw new Error('BlackSync CRM returned an unexpected call response.');
  }
  return { noteId: result.noteId, created: result.created };
};
