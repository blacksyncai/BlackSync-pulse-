export type CloseListResponse<TRecord> = {
  data: TRecord[];
  has_more: boolean;
};

export type CloseContact = {
  id: string;
  name: string | null;
  title: string | null;
  emails: { email: string; type?: string }[];
  phones: { phone: string; type?: string }[];
};

export type CloseLead = {
  id: string;
  display_name: string | null;
  url: string | null;
  description: string | null;
  status_label: string | null;
  addresses: {
    address_1?: string | null;
    address_2?: string | null;
    city?: string | null;
    state?: string | null;
    zipcode?: string | null;
    country?: string | null;
  }[];
  contacts: CloseContact[];
};

export type ClosePipeline = {
  id: string;
  name: string;
  statuses: { id: string; label: string; type: 'active' | 'won' | 'lost' }[];
};

export type CloseLeadStatus = { id: string; label: string };

export type CloseOpportunity = {
  id: string;
  pipeline_id: string | null;
  status_id: string | null;
  lead_id: string;
  lead_name: string | null;
  contact_id: string | null;
  note: string | null;
  value: number | null;
  value_currency: string | null;
  status_type: 'active' | 'won' | 'lost';
  status_label: string | null;
  confidence: number | null;
  date_won: string | null;
};

export type CloseActivityBase = {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  date_created: string;
  user_name?: string | null;
};

export type CloseNoteActivity = CloseActivityBase & { note: string | null };

export type CloseCallActivity = CloseActivityBase & {
  direction: string | null;
  duration: number | null;
  disposition: string | null;
  note: string | null;
  phone: string | null;
  recording_url: string | null;
  voicemail_url: string | null;
};

export type CloseEmailActivity = CloseActivityBase & {
  subject: string | null;
  body_text: string | null;
  direction: string | null;
  sender: string | null;
  to: string[] | null;
};

export type CloseSmsActivity = CloseActivityBase & {
  text: string | null;
  direction: string | null;
  remote_phone: string | null;
};

export type CloseTask = {
  id: string;
  lead_id: string | null;
  contact_id: string | null;
  text: string | null;
  date: string | null;
  is_complete: boolean;
};
