# blacksync.si → BlackSync Cloud

The CRM accepts completed calls at `POST /rest/pulse/calls`. The helper in this directory is intended for **the blacksync.si backend**, not a browser. Its source is fixed to `blacksync-si`; the calling app supplies its stable call ID as `externalId`.

This repository contains the receiving side and sender helper. The blacksync.si backend still needs to call `pushCompletedCall` from its own call-completed hook; the CRM side is fully wired.

## Configure the sender

Keep `BLACKSYNC_CRM_BASE_URL` and `BLACKSYNC_CRM_API_KEY` in the calling app's server-side environment. Create the key in the CRM's **Connect & automate → API** screen. Its role needs read access to the target records and read/create access to notes and note targets.

```ts
import { pushCompletedCall } from './push-completed-call';

// Run after the calling app has saved a completed call and its CRM mapping.
const result = await pushCompletedCall({
  crmBaseUrl: process.env.BLACKSYNC_CRM_BASE_URL!,
  apiKey: process.env.BLACKSYNC_CRM_API_KEY!,
  call: {
    externalId: savedCall.id,
    phoneNumber: savedCall.phoneNumber, // E.164, e.g. +15551234567
    direction: 'outbound',
    durationSeconds: savedCall.durationSeconds,
    outcome: 'answered',
    personId: mappedCrmContactId, // optional: omit to match by phoneNumber
    companyId: mappedCrmLeadId, // optional if personId is provided
    opportunityId: mappedCrmDealId, // optional: links the call to the deal
    interest: savedCall.interest, // 'high' | 'medium' | 'low' | 'none'
    nextStep: savedCall.nextStep, // creates a follow-up task when set
    nextStepDueAt: savedCall.nextStepDueAt, // ISO date, optional
    summary: savedCall.summary,
    transcript: savedCall.transcript,
    recordingUrl: savedCall.httpsRecordingUrl,
  },
});
```

The sample variable names above illustrate the mapping; they are not claims about the current blacksync.si schema.

## Delivery behavior

- The first successful event returns `{ noteId, created, personId, companyId, opportunityId, followUpTaskId }` with HTTP 201.
- A retry with the same workspace, `source`, and `externalId` returns the original note with `created: false` and HTTP 200. The first saved payload is retained.
- Use the calling app's durable job queue to retry network failures, HTTP 429, and HTTP 5xx. Keep the same external ID. Fix validation or authentication errors rather than retrying them forever. The helper throws on failures; it does not silently acknowledge or discard events.
- Recording URLs must use HTTPS. The CRM downloads the recording in the background, stores it on the call's note (so it keeps playing after the provider link expires), transcribes it with Deepgram, and writes an AI summary — the same pipeline as browser calls. If the sender supplies `transcript` and/or `summary`, those win over re-transcription.
- Contact matching: omit `personId`/`companyId` and the CRM matches the contact by `phoneNumber` (full international or national format). The response reports the matched `personId`/`companyId`. `opportunityId` optionally links the call to a deal.
- Follow-up tasks: when `outcome` is `answered` with `interest` high/medium/low, when `outcome` is `voicemail`, or when `nextStep` is set, the CRM creates a TODO task (due `nextStepDueAt`, or +4h for high / +24h otherwise) targeted at the contact, company, and opportunity. `assigneeId` picks the workspace member; otherwise the API key's user is used when available. The response includes `followUpTaskId`.
- The sender is HTTPS-only and rejects redirects so its API key is not forwarded to another host.

## Tags and follow-ups

Create multi-select tag options under **Customize → Tags** for leads, contacts, or deals. These are normal record fields available to REST, GraphQL, MCP, and workflows.

To update tags, send `PATCH /rest/people/{personId}` or `PATCH /rest/companies/{companyId}` with `{ "tags": ["CONFIGURED_OPTION_VALUE"] }` and your Bearer key. The update replaces the array; read and merge current tags if appending. Normal object/field permissions apply.

Outgoing CRM webhooks are configured separately under **Connect & automate → Webhooks**. A raw provider webhook is not accepted as this call API's payload: map it in the sender backend first.
