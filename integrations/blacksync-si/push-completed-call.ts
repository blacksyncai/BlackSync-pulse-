export type BlackSyncCompletedCall = {
  externalId: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  durationSeconds: number;
  outcome:
    'answered' | 'no-answer' | 'busy' | 'failed' | 'voicemail' | 'canceled';
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  assigneeId?: string;
  interest?: 'high' | 'medium' | 'low' | 'none';
  nextStep?: string;
  nextStepDueAt?: string;
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
}: PushCompletedCallOptions): Promise<{
  noteId: string;
  created: boolean;
  personId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  followUpTaskId: string | null;
}> => {
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
  // personId/companyId are optional: when omitted the CRM matches the contact by
  // the call's phone number.

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
  const nullableId = (value: unknown) =>
    typeof value === 'string' ? value : null;

  return {
    noteId: result.noteId,
    created: result.created,
    personId: 'personId' in result ? nullableId(result.personId) : null,
    companyId: 'companyId' in result ? nullableId(result.companyId) : null,
    opportunityId:
      'opportunityId' in result ? nullableId(result.opportunityId) : null,
    followUpTaskId:
      'followUpTaskId' in result ? nullableId(result.followUpTaskId) : null,
  };
};
