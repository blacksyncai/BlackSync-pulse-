# Tasks, lead ownership, and teams

Create and edit teams under Customize → Teams & assignments. Creating teams requires data-model and workspace-member management permissions. Membership changes require workspace-member management permission. Team definitions are stored per workspace, while lead and task assignments use real `accountOwnerId`, `assigneeId`, and `assignmentTeam` fields. The two team dropdown fields are provisioned through the normal metadata API on first creation.

Teams are operational queues, not permission groups. They do not grant or hide record access. A record can have both an individual owner and a team. Changing one preserves the other. Archived teams retain identifiers and existing assignments, but are excluded from new assignment choices. Restore them by editing the team.

Tasks support choosing a user/team when creating them, reassignment from task rows, and filters for My tasks, My teams, Everyone, a specific user/team, and no assigned user. Filters run in the task query, before its 500-record limit. A limit notice appears for larger result sets.

Leads support ownership/team assignment from the record details sidebar and bulk selected leads, including clearing either assignment. Owner and team names appear in the lead list. Saved lead views can filter a specific user and team together. Bulk task creation also accepts a task user/team assignment.

Validation: 17 focused tests cover malformed/duplicate team definitions and saved-view filtering. Isolated Chromium fixtures render the actual task hooks, task page, task composer/row, lead assignment controls, team editor and assignment provider, with API and theme boundaries mocked. They verify assignment payloads, individual/bulk lead changes, failure handling, task scope filters, team membership, metadata provisioning, archives and mobile overflow. Production build and live asset verification are separate checks; these fixtures do not prove authenticated live-workspace writes.
