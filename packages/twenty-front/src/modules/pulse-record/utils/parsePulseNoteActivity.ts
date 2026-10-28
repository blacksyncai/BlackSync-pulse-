import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';

type NoteActivity = Pick<
  PulseTimelineItem,
  | 'kind'
  | 'title'
  | 'body'
  | 'direction'
  | 'duration'
  | 'outcome'
  | 'recordingUrl'
>;

const CALL_TITLE = /^(outbound|inbound|call) call\b/i;
const EMAIL_TITLE = /^email (sent|received):\s*/i;
const SMS_TITLE = /^text (sent|received)$/i;
const RECORDING_LINK = /\[(?:call recording|voicemail)\]\((\S+?)\)/i;

const stripRecordingLinks = (markdown: string) =>
  markdown
    .replace(/\[(?:call recording|voicemail)\]\(\S+?\)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// Calls, emails and texts imported from Close are stored as notes whose title follows a
// fixed pattern; this turns them back into typed activities for the timeline.
export const parsePulseNoteActivity = (
  title: string,
  markdown: string,
): NoteActivity => {
  if (CALL_TITLE.test(title)) {
    const [direction, duration, outcome] = title
      .split('·')
      .map((part) => part.trim());

    return {
      kind: 'call',
      title: direction,
      body: stripRecordingLinks(markdown),
      direction: /^inbound/i.test(direction) ? 'inbound' : 'outbound',
      duration: duration ?? null,
      outcome: outcome ?? null,
      recordingUrl: markdown.match(RECORDING_LINK)?.[1] ?? null,
    };
  }

  const emailMatch = title.match(EMAIL_TITLE);

  if (emailMatch !== null) {
    return {
      kind: 'email',
      title: title.replace(EMAIL_TITLE, '') || '(no subject)',
      body: markdown,
      direction:
        emailMatch[1].toLowerCase() === 'received' ? 'inbound' : 'outbound',
      duration: null,
      outcome: null,
      recordingUrl: null,
    };
  }

  const smsMatch = title.match(SMS_TITLE);

  if (smsMatch !== null) {
    return {
      kind: 'sms',
      title,
      body: markdown,
      direction:
        smsMatch[1].toLowerCase() === 'received' ? 'inbound' : 'outbound',
      duration: null,
      outcome: null,
      recordingUrl: null,
    };
  }

  return {
    kind: 'note',
    title: title || 'Note',
    body: markdown,
    direction: null,
    duration: null,
    outcome: null,
    recordingUrl: null,
  };
};
