# Forms, submissions and lead ponds

Open **Setup → Forms & submissions** (`/forms`). Create or edit a form, choose its visible contact fields, labels and required fields, introduction, button text and success message. Require an email address or international phone number. Save as draft or publish; pausing a form makes its public route unavailable.

## Destination

A pond is a named lead pool stored in the company `leadPond` select field. The builder can create that field and options through the existing metadata editor, subject to the member's metadata permissions. Select a pond to put newly created unassigned leads into it. In Leads, the pond selector applies the pond and unassigned-owner filters; views can be saved with these filters. Existing bulk Assign to me remains an assignment action, not a concurrency-guaranteed claim queue.

Optionally select a pipeline board and starting stage. The backend resolves the actual stage field and pipeline selector from workspace metadata and validates them again at submission time. Boards with additional filters are rejected rather than create an inquiry that cannot appear on the chosen board. Lead-only forms create no opportunity.

## Public collection

Share the hosted URL `/webhooks/forms/<form UUID>` on the CRM host. The page is rendered by the backend, works without JavaScript, has required-field validation, and adapts to mobile. This release provides hosted links; cross-site iframe embedding and a custom-question builder are not included. The six configurable field types are first name, last name, email, phone, company and message.

Each submission stores a linked note with the answers and creates a lead/contact as needed. Exact case-insensitive email matches reuse an accessible existing contact, preserving its company, owner, pond and existing deal stages. Ambiguous matches are rejected; phone-only submissions do not merge contacts by phone. A new inquiry can create a new deal even for an existing contact. Contacts without a company retain that relationship; the inquiry gets a new lead linked through its submission note.

Browser POST retries use a submission UUID and a payload fingerprint. A transaction advisory lock serializes retries, and matching-email locks serialize contact creation across forms. CRM records, note targets and the internal receipt commit together. Reusing an ID with different data is rejected. Each distinct submission is an inquiry, so deliberately submitting the form again can create a new opportunity.

The form owner can review the latest 100 submission receipts and open their notes. Answers live in the permission-aware CRM note; the receipt stores record IDs, time and fingerprint. Forms are managed by their publishing member. Each submission resolves current membership and uses that member's current ORM permissions. Removing access stops writes; the endpoint does not use permission bypass or trust client-supplied destinations, owner IDs or workspace IDs.

The public receiver includes a honeypot, input limits and Redis-backed limits of 10 POST attempts per IP/minute and 100 per form/hour. It returns no CRM IDs. Published GET/POST responses are not cached, escape HTML and disallow scripts and third-party framing. This is basic abuse protection, not CAPTCHA. Form configuration uses the existing workspace-scoped key-value store; no new database entity or migration is required.

## Verification

32 focused tests passed for validation, HTML escaping, destination routing, publisher membership, existing contact preservation, permission-aware repository calls, transaction failure behavior, idempotent retries and pond filters. Database and metadata boundaries in the service tests are mocked; they do not prove real PostgreSQL concurrency behavior. Hosted-page Chromium checks passed required-field validation, form nonce and mobile overflow. An isolated builder fixture with mocked API/metadata passed pond and stage selection, publish/pause, success-message editing, submission opening, pond creation and mobile overflow checks; its CSS adapter does not prove the full Linaria build. Full application build and a live workspace submission still need release verification.
