export type PulseLeadContact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

export type PulseLead = {
  id: string;
  name: string | null;
  domain: string | null;
  leadStatus: string | null;
  ownerId: string | null;
  createdAt: string;
  contactCount: number;
  primaryContact: PulseLeadContact | null;
  lastActivityAt: string | null;
  lastCallAt: string | null;
  callCount: number;
  nextTaskAt: string | null;
  openTaskCount: number;
  dealCount: number;
  dealValueMicros: number;
};
