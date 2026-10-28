export type PulseDashboardData = {
  pipelineHistory: {
    label: string;
    early: number;
    late: number;
    won: number;
  }[];
  stages: { label: string; count: number; amount: number }[];
  openPipeline: number;
  openCount: number;
  wonCount: number;
  wonAmount: number;
  wonThisMonthCount: number;
  wonThisMonthAmount: number;
  dialsToday: number;
  dialsThisWeek: number;
  tasksOpen: number;
  tasksOverdue: number;
  upcomingTasks: { title: string; due: string; isOverdue: boolean }[];
  meetingsThisWeek: number;
  peopleCount: number;
  companyCount: number;
  activity: { months: string[]; created: number[]; won: number[] };
  topDeals: { name: string; company: string; amount: number; stage: string }[];
};
