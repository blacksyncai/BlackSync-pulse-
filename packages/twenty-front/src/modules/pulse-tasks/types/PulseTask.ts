export type PulseTaskTarget = {
  companyId: string | null;
  companyName: string | null;
  personId: string | null;
  personName: string | null;
};

export type PulseTask = {
  id: string;
  title: string;
  status: string | null;
  dueAt: Date | null;
  createdAt: Date;
  assigneeId: string | null;
  assigneeName: string | null;
  priority: string | null;
  target: PulseTaskTarget | null;
};

export type PulseTaskGroupId =
  | 'overdue'
  | 'today'
  | 'upcoming'
  | 'someday'
  | 'done';
