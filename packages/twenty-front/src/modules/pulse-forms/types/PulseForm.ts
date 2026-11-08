export type PulseFormFieldKey =
  'firstName' | 'lastName' | 'email' | 'phone' | 'company' | 'message';
export type PulseFormField = {
  key: PulseFormFieldKey;
  label: string;
  required: boolean;
};
export type PulseFormDefinition = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  published: boolean;
  fields: PulseFormField[];
  pondValue: string | null;
  pipelineViewId: string | null;
  stageValue: string | null;
};
export type PulseForm = PulseFormDefinition & { id: string; revision: number };
export type PulseFormSubmission = {
  submittedAt: string;
  companyId: string;
  personId: string;
  opportunityId: string | null;
  noteId: string;
};
