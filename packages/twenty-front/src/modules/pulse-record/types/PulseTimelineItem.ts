export type PulseTimelineKind = 'call' | 'email' | 'sms' | 'note' | 'task';

export type PulseTimelineItem = {
  id: string;
  kind: PulseTimelineKind;
  title: string;
  body: string;
  date: Date;
  direction: 'inbound' | 'outbound' | null;
  duration: string | null;
  outcome: string | null;
  recordingUrl: string | null;
  isDone: boolean;
  openRecordId: string;
  openObjectNameSingular: string;
  contactName?: string | null;
  repName?: string | null;
};
