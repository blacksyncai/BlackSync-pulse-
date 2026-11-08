# BlackSync sales workspace

The default dashboard now opens an action workspace: capture a task, complete or defer follow-ups, review deals with upcoming/overdue close dates, and open recent call notes. The existing permission-aware record hooks and mutations handle reads and writes. My work is scoped to the signed-in workspace member; Team shows permitted team tasks.

The first dashboard load requests at most 60 open tasks, 12 closing deals and 8 call-note summaries. The previous page requested up to 500 opportunities, 200 tasks, 200 calendar events, 1,000 call notes and separate contact/company counts. Sections load and recover independently. This reduces requested data; it is not a measured claim about production latency or initial metadata boot time.

Task completion, priority and snooze controls now disable during a mutation and report errors. Controls are available on keyboard focus and touch. Successful dashboard mutations refetch its task list. New tasks use the existing assignment, priority and due-date creation flow.

Close dates retain their calendar day across timezones. Deal values use their stored currency; missing amounts/currencies are shown as unknown. Closing deals exclude the standard CUSTOMER (won) stage and include dated deals due by the next 14 days. Workspaces with custom terminal stages need explicit stage mappings before applying this view to those stages. Calls use the existing call-note title convention; no transcript or recording is downloaded for the summary list. Opening a call shows its existing record and saved content.

Lists are deliberately bounded. All-task and pipeline links give access to the full record workflows; no partial-list counts are presented as workspace totals. The former chart page reconstructed historical stages from current records; this release removes that chart from the home route rather than present it as actual historical reporting.

Startup uses a local BlackSync mark and a recovery message after 15 seconds; no simulated progress percentage or artificial minimum delay. The sign-in logo, default workspace logo, favicon and social metadata use BlackSync assets. Workspace-uploaded logos remain supported.

Validation: six focused task-grouping and deal-format tests passed, including calendar-date handling in America/Los_Angeles. The changed React modules bundle in an isolated fixture. Browser testing was attempted but Chromium cannot start inside the current sandbox (setsockopt: Operation not permitted). Full application type checking, production build and live account checks are not established by the fixture. Release through the existing Pulse deployment workflow and verify that deployment independently.
