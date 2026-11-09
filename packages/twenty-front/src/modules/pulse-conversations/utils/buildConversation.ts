import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';
import { parsePulseCallBody } from '@/pulse-record/utils/parsePulseCallBody';
import { parsePulseNoteActivity } from '@/pulse-record/utils/parsePulseNoteActivity';

export type ConversationNote = ObjectRecord & {
  title: string | null;
  createdAt: string;
  createdBy?: { name: string | null } | null;
  bodyV2: { markdown: string | null } | null;
};
type Company = {
  id: string;
  name: string | null;
  address: {
    addressCity?: string | null;
    addressState?: string | null;
    addressCountry?: string | null;
  } | null;
};
export type ConversationTarget = ObjectRecord & {
  noteId: string;
  targetPerson: {
    id: string;
    name: { firstName: string | null; lastName: string | null } | null;
    company: Company | null;
  } | null;
  targetCompany: Company | null;
};
export type ConversationAttachment = ObjectRecord & {
  targetNoteId: string;
  file: { url?: string; extension?: string; mimeType?: string }[] | null;
};
export type Conversation = PulseTimelineItem & {
  phone: string;
  companyName: string;
  companyId: string | null;
  personId: string | null;
  location: string;
  searchText: string;
  hasTranscript: boolean;
};
const safeMediaUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return ['https:', 'http:'].includes(parsed.protocol) ? value : null;
  } catch {
    return null;
  }
};
export const buildConversation = (
  note: ConversationNote,
  targets: ConversationTarget[],
  attachments: ConversationAttachment[],
): Conversation => {
  const activity = parsePulseNoteActivity(
    note.title ?? '',
    note.bodyV2?.markdown ?? '',
  );
  const parsed = parsePulseCallBody(activity.body);
  const person = targets.find(
    (target) => target.noteId === note.id && target.targetPerson,
  )?.targetPerson;
  const company =
    targets.find((target) => target.noteId === note.id && target.targetCompany)
      ?.targetCompany ?? person?.company;
  const contactName = [person?.name?.firstName, person?.name?.lastName]
    .filter(Boolean)
    .join(' ');
  const phone =
    parsed.facts.find((fact) =>
      /^(phone|to|called number|number)$/i.test(fact.label),
    )?.value ?? '';
  const location = [
    company?.address?.addressCity,
    company?.address?.addressState,
    company?.address?.addressCountry,
  ]
    .filter(Boolean)
    .join(', ');
  const storedUrl = attachments
    .filter((attachment) => attachment.targetNoteId === note.id)
    .flatMap((attachment) => attachment.file ?? [])
    .find(
      (file) =>
        /^(mp3|wav|m4a|ogg|webm|aac|flac|opus)$/i.test(
          (file.extension ?? '').replace(/^\./, ''),
        ) || file.mimeType?.startsWith('audio/'),
    )?.url;
  return {
    ...activity,
    id: note.id,
    kind: 'call',
    title: contactName || phone || note.title || 'Call',
    body: activity.body,
    date: new Date(note.createdAt),
    recordingUrl:
      safeMediaUrl(storedUrl) ?? safeMediaUrl(activity.recordingUrl),
    isDone: false,
    openRecordId: note.id,
    openObjectNameSingular: 'note',
    contactName: contactName || null,
    repName: note.createdBy?.name ?? null,
    phone,
    companyName: company?.name ?? '',
    companyId: company?.id ?? null,
    personId: person?.id ?? null,
    location,
    hasTranscript: parsed.transcript.length > 0,
    searchText: [
      contactName,
      phone,
      company?.name,
      location,
      note.title,
      activity.body,
      note.createdBy?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase(),
  };
};
export const filterConversations = (
  calls: Conversation[],
  search: string,
  direction: string,
  recordedOnly: boolean,
) => {
  const words = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return calls.filter(
    (call) =>
      words.every((word) => call.searchText.includes(word)) &&
      (direction === 'all' || call.direction === direction) &&
      (!recordedOnly || Boolean(call.recordingUrl)),
  );
};
