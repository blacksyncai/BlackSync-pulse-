import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type PulseDashboardData } from '@/pulse-dashboard/types/PulseDashboardData';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type OpportunityRow = {
  id: string;
  name: string | null;
  stage: string | null;
  createdAt: string;
  closeDate: string | null;
  amount: { amountMicros: number | null } | null;
  company: { name: string | null } | null;
};

type TaskRow = {
  id: string;
  title: string | null;
  status: string | null;
  dueAt: string | null;
};

type CalendarEventRow = { id: string; startsAt: string | null };

const WON_STAGE = 'CUSTOMER';
const EARLY_STAGES = ['NEW', 'SCREENING'];
const STAGE_ORDER = ['NEW', 'SCREENING', 'MEETING', 'PROPOSAL', 'CUSTOMER'];
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  SCREENING: 'Screen',
  MEETING: 'Meet',
  PROPOSAL: 'Prop',
  CUSTOMER: 'Won',
};

const toDollars = (opportunity: OpportunityRow) =>
  (opportunity.amount?.amountMicros ?? 0) / 1_000_000;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const usePulseDashboardData = () => {
  const { records: opportunities, loading: opportunitiesLoading } =
    useFindManyRecords<OpportunityRow & { __typename: string }>({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      recordGqlFields: {
        id: true,
        name: true,
        stage: true,
        createdAt: true,
        closeDate: true,
        amount: { amountMicros: true },
        company: { name: true },
      },
      limit: 500,
    });

  const { records: tasks, loading: tasksLoading } = useFindManyRecords<
    TaskRow & { __typename: string }
  >({
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFields: { id: true, title: true, status: true, dueAt: true },
    filter: { status: { neq: 'DONE' } },
    limit: 200,
  });

  const { totalCount: peopleCount } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Person,
    recordGqlFields: { id: true },
    limit: 1,
  });

  const { totalCount: companyCount } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Company,
    recordGqlFields: { id: true },
    limit: 1,
  });

  const weekStart = startOfDay(new Date());
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { records: meetings } = useFindManyRecords<
    CalendarEventRow & { __typename: string }
  >({
    objectNameSingular: CoreObjectNameSingular.CalendarEvent,
    recordGqlFields: { id: true, startsAt: true },
    filter: {
      startsAt: {
        gte: weekStart.toISOString(),
        lt: weekEnd.toISOString(),
      },
    },
    limit: 200,
  });

  const data = useMemo<PulseDashboardData>(() => {
    const now = new Date();
    const today = startOfDay(now);

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        start: date,
        end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      };
    });

    // Open pipeline as it stood at each month end, split by how far deals had progressed.
    const pipelineHistory = months.map((month) => {
      const created = opportunities.filter(
        (opportunity) => new Date(opportunity.createdAt) < month.end,
      );
      const sum = (predicate: (opportunity: OpportunityRow) => boolean) =>
        created.filter(predicate).reduce((total, o) => total + toDollars(o), 0);
      return {
        label: month.label,
        early: sum((o) => EARLY_STAGES.includes(o.stage ?? '')),
        late: sum(
          (o) => !EARLY_STAGES.includes(o.stage ?? '') && o.stage !== WON_STAGE,
        ),
        won: sum((o) => o.stage === WON_STAGE),
      };
    });

    const stages = STAGE_ORDER.map((stage) => {
      const inStage = opportunities.filter((o) => o.stage === stage);
      return {
        label: STAGE_LABELS[stage],
        count: inStage.length,
        amount: inStage.reduce((total, o) => total + toDollars(o), 0),
      };
    });

    const openDeals = opportunities.filter((o) => o.stage !== WON_STAGE);
    const wonDeals = opportunities.filter((o) => o.stage === WON_STAGE);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const wonThisMonth = wonDeals.filter(
      (o) =>
        new Date(o.closeDate ?? o.createdAt) >= monthStart ||
        new Date(o.createdAt) >= monthStart,
    );

    const lastSixMonths = months.slice(-6);
    const activity = {
      months: lastSixMonths.map((month) => month.label),
      created: lastSixMonths.map(
        (month) =>
          opportunities.filter((o) => {
            const createdAt = new Date(o.createdAt);
            return createdAt >= month.start && createdAt < month.end;
          }).length,
      ),
      won: lastSixMonths.map(
        (month) =>
          wonDeals.filter((o) => {
            const closedAt = new Date(o.closeDate ?? o.createdAt);
            return closedAt >= month.start && closedAt < month.end;
          }).length,
      ),
    };

    const dueTasks = tasks
      .filter((task) => isDefined(task.dueAt))
      .sort(
        (a, b) =>
          new Date(a.dueAt ?? 0).getTime() - new Date(b.dueAt ?? 0).getTime(),
      );

    return {
      pipelineHistory,
      stages,
      openPipeline: openDeals.reduce((total, o) => total + toDollars(o), 0),
      openCount: openDeals.length,
      wonCount: wonDeals.length,
      wonAmount: wonDeals.reduce((total, o) => total + toDollars(o), 0),
      wonThisMonthCount: wonThisMonth.length,
      wonThisMonthAmount: wonThisMonth.reduce(
        (total, o) => total + toDollars(o),
        0,
      ),
      // Call logging is not built yet, so dials stay at zero until calls are recorded.
      dialsToday: 0,
      dialsThisWeek: 0,
      tasksOpen: tasks.length,
      tasksOverdue: dueTasks.filter((task) => new Date(task.dueAt ?? 0) < today)
        .length,
      upcomingTasks: dueTasks.slice(0, 3).map((task) => ({
        title: task.title || 'Untitled task',
        due: new Date(task.dueAt ?? 0).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        isOverdue: new Date(task.dueAt ?? 0) < today,
      })),
      meetingsThisWeek: meetings.length,
      peopleCount: peopleCount ?? 0,
      companyCount: companyCount ?? 0,
      activity,
      topDeals: [...openDeals]
        .sort((a, b) => toDollars(b) - toDollars(a))
        .slice(0, 3)
        .map((o) => ({
          name: o.name || 'Untitled deal',
          company: o.company?.name ?? '',
          amount: toDollars(o),
          stage: STAGE_LABELS[o.stage ?? ''] ?? o.stage ?? '',
        })),
    };
  }, [opportunities, tasks, meetings, peopleCount, companyCount]);

  return { data, loading: opportunitiesLoading || tasksLoading };
};
