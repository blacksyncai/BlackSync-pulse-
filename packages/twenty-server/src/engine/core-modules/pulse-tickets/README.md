# Client tickets

Open **Client delivery → Client tickets**. A member with DATA_MODEL permission enables the workspace board once. The setup creates a native `clientTicket` object and a Kanban view; partially completed setup can be retried. Sales opportunities and tasks are unchanged. The board uses ordinary record CRUD, roles, filters, search, drag-and-drop, and record details. New manual tickets default to New / Normal / Manual. Client and assignee are real company/workspaceMember relations. Project is a grouping label, not a separate project object.

## MCP

Reconnect BlackSync MCP after setup to refresh the tool catalog. Learn the `create_one_clientTicket`, `find_many_clientTickets`, and `update_one_clientTicket` schemas through the existing MCP tool discovery. Inspect field metadata for option values. Resolve `clientId` and `assigneeId` from real records, then set `source: MCP`. Existing OAuth/API-key role intersections apply. No second MCP server or permission bypass is introduced.

## Email capture

**Client delivery → Ticket email rules** lists only the signed-in user's connected mailboxes. Capture is off until explicitly enabled for a mailbox. Each rule has 1–20 subject keywords. Incoming mail must be newer than the last rule save and match a keyword. The sender must resolve to exactly one accessible client through a CRM contact. Old imports, drafts, outgoing messages, ambiguous clients, and unrecognized senders do not create tickets. Rules are deterministic keyword rules, not an AI classifier.

The existing five-minute cron processes up to 100 associations per rule per run in ascending creation time / ID order. It rebuilds the owner's current auth context, rechecks membership and mailbox ownership, and uses permission-checked repositories. Disabled sync, revoked permissions, or a disconnected mailbox stop capture. Failed batches retain the cursor and retry. Matching tickets are assigned to the mailbox owner in New for triage.

The subject becomes a shared title. Bodies and attachments are never copied. Ticket permissions control visibility. Source message/thread IDs preserve provenance; review the matching conversation in Inbox. One ticket per workspace/mailbox/thread, including after the ticket is completed or soft-deleted; replies do not reopen tickets. Deterministic UUIDs plus a transaction advisory lock prevent duplicate creation during cursor retries/concurrent scans. The cursor commits after the tickets. A user can move a reviewed ticket to To do, assign another teammate, set priority/due date, or mark Done.

Changing or re-enabling a rule starts from now. There is no historic inbox backfill, client-facing auto-reply, or arbitrary email-body execution. Client emails are not sent simply because a ticket exists. Existing welcome/task email notifications remain independent.

## Validation

Focused service tests cover mailbox isolation, membership removal, incoming-only queries, ambiguity, no-body copying, old imports, duplicate/deleted threads, cursor replay, and denied record writes. Parser tests cover keyword validation, case matching, disabled rules, and date boundaries. These run with mocked infrastructure and are not authenticated production inbox tests.
