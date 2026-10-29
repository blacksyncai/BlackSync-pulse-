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

export type PulseEnrollment = {
  id: string;
  sequenceId: string;
  personId: string;
  companyId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  status: 'active' | 'finished' | 'stopped' | 'replied' | 'failed';
  stepIndex: number;
  nextSendAt: string | null;
  enrolledAt: string;
  lastSentAt: string | null;
  sentCount: number;
  lastError: string | null;
};

export type PulseOutreachStatus = {
  canSend: boolean;
  fromAddress: string;
  replyTo: string;
};
