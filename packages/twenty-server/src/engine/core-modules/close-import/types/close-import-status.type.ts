export type CloseImportState = 'idle' | 'running' | 'done' | 'failed';

export type CloseImportCounts = {
  companies: number;
  people: number;
  opportunities: number;
  notes: number;
  calls: number;
  emails: number;
  texts: number;
  tasks: number;
};

export type CloseImportStatus = {
  state: CloseImportState;
  organizationName: string | null;
  currentStep: string | null;
  counts: CloseImportCounts;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type CloseImportJobData = {
  workspaceId: string;
  apiKey: string;
  organizationName: string;
  userWorkspaceId?: string;
};
