export type BlackSyncHelpArticle = {
  title: string;
  keywords: string[];
  content: string;
};

// The help center answers from BlackSync Cloud's own guide, kept in sync with the product.
export const BLACKSYNC_HELP_ARTICLES: BlackSyncHelpArticle[] = [
  {
    title: 'Connect BlackSync MCP to Claude and ChatGPT',
    keywords: [
      'mcp',
      'claude',
      'chatgpt',
      'connector',
      'connect',
      'api',
      'oauth',
    ],
    content:
      'Open Connect & automate in the sidebar, then MCP. Copy your workspace MCP URL ending in /mcp. Add a custom MCP server named BlackSync Cloud in ChatGPT Plugins, or a custom connector in Claude. Choose OAuth and authorize with your BlackSync account. Access depends on the client plan and workspace permissions. For clients supporting static headers, create an API key and use Authorization: Bearer YOUR_API_KEY. This connects to this BlackSync workspace, not another CRM service.',
  },
  {
    title: 'Push external call activity into BlackSync',
    keywords: [
      'webhook',
      'api',
      'call',
      'external',
      'recording',
      'integration',
      'retry',
    ],
    content:
      'POST /rest/pulse/calls with a Bearer API key and normalized JSON: source, externalId, phoneNumber in E.164 format, direction (inbound or outbound), durationSeconds, outcome, and personId or companyId. Optional summary, transcript and HTTPS recordingUrl appear on the call card. The first write returns 201; replaying the same source and externalId in the workspace returns 200 with the same noteId. The API requires record permissions, attaches existing records only, and does not fetch or transcribe external recording URLs. Raw provider webhooks need a server-side adapter.',
  },
  {
    title: 'Tags on leads, contacts and deals',
    keywords: ['tags', 'tag', 'label', 'segment', 'multi-select'],
    content:
      'Open Customize → Tags and select Leads, Contacts or Deals. Add reusable tag options and save. Apply tags from the record custom fields. Tags are regular multi-select fields named tags and are available to REST record APIs, MCP and workflows. PATCH updates replace the tags array; read existing values first to append without losing tags.',
  },
  {
    title: 'About BlackSync Cloud',
    keywords: [
      'about',
      'company',
      'founders',
      'owner',
      'who built',
      'made',
      'blacksync',
    ],
    content:
      'BlackSync Cloud is the CRM made by BlackSync AI. It was founded by Hamza Basal and Rithvik Burri. It brings leads, deals, calls, emails, texts, tasks and AI together in one place, with a built-in phone, power dialer, email sequences and an AI assistant.',
  },
  {
    title: 'Leads and Smart Views',
    keywords: [
      'lead',
      'leads',
      'smart view',
      'filter',
      'list',
      'bulk',
      'status',
      'never called',
      'no touch',
    ],
    content:
      'Open Leads in the sidebar to see every lead with its status, main contact, last touch (call, email, text or note), number of calls, next task and deal value. Smart Views are saved filters: built-in ones include Never called, No touch in 7 days, Overdue follow-ups and Leads with deals. Combine filters (status, last touch, calls, tasks, deals, owner, has phone, has email), then click "Save as Smart View" to share it with your team; it appears in the sidebar under Leads. Select leads to change status, add a task to each, assign them to yourself, add them to a sequence, dial them, or delete them. Use "New lead" to create a company and its contact in one step.',
  },
  {
    title: 'Lead page',
    keywords: [
      'lead page',
      'account',
      'company page',
      'feed',
      'timeline',
      'conversations',
      'notes',
      'details',
    ],
    content:
      'Click a lead to open its page in a wide panel. The left side shows About, open tasks, opportunities with pipeline and stage, contacts with call, email and text buttons, and your custom fields. The right side is the activity feed with All, Conversations, Notes and Tasks filters and search. Use the buttons at the top to log a Meeting, write a Note, add a Task, send an Email, send an SMS or Call the main contact.',
  },
  {
    title: 'Calls, recordings and transcripts',
    keywords: [
      'call',
      'phone',
      'dial',
      'recording',
      'transcript',
      'transcribe',
      'caller id',
      'microphone',
      'record',
    ],
    content:
      'Click the phone icon at the top of the sidebar to choose your caller ID, turn auto-record on or off, pick your microphone and speakers, or dial a number. Every call is logged on the lead with its duration and outcome. Call cards have Summary, Transcript and Details tabs; recorded calls are transcribed automatically, and a call with a recording but no transcript has a "Transcribe now" button. If a call cannot start, the message explains why (for example a blocked microphone).',
  },
  {
    title: 'Power dialer',
    keywords: [
      'power dialer',
      'dialer',
      'auto dial',
      'call list',
      'outcome',
      'disposition',
      'session',
    ],
    content:
      'Open Power dialer in the sidebar and pick a Smart View, or select leads on the Leads page and click "Dial selected" or "Power dial". The dialer calls down the list. After each call choose an outcome (Connected, Interested, Not interested, Call back later, Left voicemail, No answer, Busy, Wrong number) with keys 1 to 8, add notes, change the lead status or schedule a follow-up task, then press Enter to save; with Auto-dial on, the next lead is called after 3 seconds. Stats show dials, connects, connect rate and talk time.',
  },
  {
    title: 'Opportunities and pipelines',
    keywords: [
      'opportunity',
      'opportunities',
      'deal',
      'pipeline',
      'stage',
      'board',
      'kanban',
      'card',
    ],
    content:
      'Opportunities shows your deals as a board with a tab for each pipeline. Drag cards between stages, click the pencil to edit value, stage, close date and notes, or double-click to open the lead. Cards show the company logo, value, contact with call, email and text buttons, and when the lead was last contacted and how. Use "Customize cards" to choose what cards show. Create new pipelines with the Pipeline builder or under Customize.',
  },
  {
    title: 'To-do, urgent tasks and notifications',
    keywords: [
      'task',
      'to-do',
      'todo',
      'urgent',
      'reminder',
      'notification',
      'bell',
      'due',
      'overdue',
      'snooze',
    ],
    content:
      'To-do lists your tasks by Overdue, Today, Upcoming and No due date. Add a task with a due time and mark it Urgent; check it off, snooze it a day or flag it urgent from the list. The bell at the top shows overdue and due-soon tasks; turn on desktop alerts from the bell. Reminder emails go out before a task is due and when someone assigns you a task; change this under Customize > Notifications.',
  },
  {
    title: 'Email templates and sequences',
    keywords: [
      'email',
      'template',
      'sequence',
      'follow-up',
      'outreach',
      'campaign',
      'reply',
    ],
    content:
      'Under Templates & sequences, create templates with variables such as first name and company, with a live preview. Sequences send a series of templates on a schedule, waiting a set number of days between steps, and stop automatically for anyone who replies. Add people from the Leads page by selecting leads and choosing "Add to sequence". Every email sent is logged on the lead. The Email button on a lead page opens a composer where you can start from a template.',
  },
  {
    title: 'Customize BlackSync Cloud',
    keywords: [
      'customize',
      'settings',
      'custom field',
      'field',
      'status',
      'lead status',
      'priority',
      'stages',
      'colors',
    ],
    content:
      'Open Customize in the sidebar to rename, recolor, reorder, add or remove lead statuses and pipeline stages; add custom fields (text, number, money, date, dropdown, multi-select, checkbox, link) to leads, contacts or deals, which then appear on the lead page; edit task priorities; choose what deal cards show; and set reminder email preferences.',
  },
  {
    title: 'Importing from Close',
    keywords: [
      'import',
      'close',
      'migrate',
      'migration',
      'sync',
      'csv',
      'remove import',
    ],
    content:
      'Open Import, paste your Close API key and click "Start migration" to bring over leads, contacts, opportunities with their exact pipelines and stages, notes, calls with recordings, emails, texts and tasks. "Sync again" updates without creating duplicates. "Remove imported data" deletes everything the import created so you can start fresh. You can also import CSV files.',
  },
  {
    title: 'AI assistant',
    keywords: ['ai', 'assistant', 'ask ai', 'chat', 'summarize', 'draft'],
    content:
      "Ask AI answers questions about your data, summarizes the page you are on, filters views, creates and updates records and tasks from plain English, and drafts emails from a lead's history.",
  },
  {
    title: 'Team, sign-up and login',
    keywords: [
      'invite',
      'team',
      'member',
      'sign up',
      'signup',
      'login',
      'password',
      'workspace',
      'account',
    ],
    content:
      'New companies sign up at app.blacksync.cloud and get their own workspace address. Invite teammates from Settings > Members; they receive an email from BlackSync Cloud with a join link. Reset a password from the login page.',
  },
];
