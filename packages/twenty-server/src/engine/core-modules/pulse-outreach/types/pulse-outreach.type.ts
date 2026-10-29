export type PulseEmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export type PulseSequenceStep = {
  id: string;
  templateId: string;
  delayDays: number;
};

export type PulseSequence = {
  id: string;
  name: string;
  steps: PulseSequenceStep[];
  isActive: boolean;
};

export type PulseSender = {
  workspaceMemberId: string | null;
  firstName: string;
  lastName: string;
  email: string;
};

export type PulseRecipient = {
  personId: string;
  companyId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
};

export type PulseEnrollmentStatus =
  | 'active'
  | 'finished'
  | 'stopped'
  | 'replied'
  | 'failed';

export type PulseEnrollment = PulseRecipient & {
  id: string;
  sequenceId: string;
  status: PulseEnrollmentStatus;
  stepIndex: number;
  nextSendAt: string | null;
  enrolledAt: string;
  lastSentAt: string | null;
  sentCount: number;
  lastError: string | null;
  sender: PulseSender;
};
