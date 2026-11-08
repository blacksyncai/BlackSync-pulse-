import { type PulseDashboardData } from '@/pulse-dashboard/types/PulseDashboardData';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
export type AnalyticsOpportunity = {
  id: string;
  name: string | null;
  stage?: string | null;
  pipeline?: string | null;
  createdAt: string;
  closeDate: string | null;
  amount: { amountMicros: number | null; currencyCode: string | null } | null;
  company: { name: string | null } | null;
  [fieldName: string]: unknown;
};
export const buildPulseAnalytics = (
  opportunities: AnalyticsOpportunity[],
  pipelines: PulsePipeline[],
  currencyCode: string,
  now: Date,
) => {
  const deals = opportunities.filter(
    (deal) => (deal.amount?.currencyCode || 'USD') === currencyCode,
  );
  const months = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return {
      label: start.toLocaleDateString('en-US', { month: 'short' }),
      start,
      end: new Date(start.getFullYear(), start.getMonth() + 1, 1),
    };
  });
  const categorized = deals.map((deal) => {
    const pipeline =
      pipelines.find(
        (candidate) =>
          candidate.pipelineValue !== null &&
          candidate.pipelineValue === deal.pipeline,
      ) ??
      (pipelines.length === 1
        ? pipelines[0]
        : pipelines.find((candidate) => candidate.isDefault));
    const value = String(deal[pipeline?.stageFieldName ?? 'stage'] ?? '');
    const option = pipeline?.stages.find((stage) => stage.value === value);
    const label = option?.label ?? value;
    const isLost =
      /\blost\b|disqualified|not.?interested|already.*solution|unqualified/i.test(
        label,
      );
    const isWon = !isLost && /\bwon\b|^customer$|closed.?won/i.test(label);
    const position =
      pipeline?.stages.findIndex((stage) => stage.value === value) ?? -1;
    const group = isWon
      ? 'Won'
      : isLost
        ? 'Lost'
        : !value
          ? 'Unassigned'
          : (position >= 0 && position < 2) || /^(new|screening)$/i.test(label)
            ? 'Early'
            : 'In progress';
    return {
      deal,
      label,
      group,
      amount: (deal.amount?.amountMicros ?? 0) / 1_000_000,
      isWon,
      isLost,
    };
  });
  const won = categorized.filter((row) => row.isWon),
    lost = categorized.filter((row) => row.isLost),
    open = categorized.filter((row) => !row.isWon && !row.isLost);
  const sum = (rows: typeof categorized) =>
    rows.reduce((total, row) => total + row.amount, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const validClosed = (deal: AnalyticsOpportunity) =>
    deal.closeDate ? new Date(deal.closeDate) : null;
  const wonThisMonth = won.filter((row) => {
    const date = validClosed(row.deal);
    return date !== null && date >= monthStart && date <= now;
  });
  const pipelineHistory = months.map((month) => {
    const cohort = categorized.filter((row) => {
      const created = new Date(row.deal.createdAt);
      return created >= month.start && created < month.end && created <= now;
    });
    return {
      label: month.label,
      early: sum(
        cohort.filter(
          (row) => row.group === 'Early' || row.group === 'Unassigned',
        ),
      ),
      late: sum(cohort.filter((row) => row.group === 'In progress')),
      won: sum(cohort.filter((row) => row.isWon)),
    };
  });
  const stages = ['Early', 'In progress', 'Won', 'Lost', 'Unassigned'].map(
    (label) => {
      const rows = categorized.filter((row) => row.group === label);
      return { label, count: rows.length, amount: sum(rows) };
    },
  );
  const activity = {
    months: months.slice(-6).map((month) => month.label),
    created: months.slice(-6).map(
      (month) =>
        categorized.filter((row) => {
          const date = new Date(row.deal.createdAt);
          return date >= month.start && date < month.end && date <= now;
        }).length,
    ),
    won: months.slice(-6).map(
      (month) =>
        won.filter((row) => {
          const date = validClosed(row.deal);
          return (
            date !== null &&
            date >= month.start &&
            date < month.end &&
            date <= now
          );
        }).length,
    ),
  };
  return {
    currencyCode,
    pipelineHistory,
    stages,
    activity,
    openPipeline: sum(open),
    openCount: open.length,
    wonCount: won.length,
    wonAmount: sum(won),
    lostCount: lost.length,
    lostAmount: sum(lost),
    wonThisMonthCount: wonThisMonth.length,
    wonThisMonthAmount: sum(wonThisMonth),
    topDeals: [...open]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .map((row) => ({
        name: row.deal.name || 'Untitled deal',
        company: row.deal.company?.name ?? '',
        amount: row.amount,
        stage: row.label,
      })),
  } satisfies Pick<
    PulseDashboardData,
    | 'currencyCode'
    | 'pipelineHistory'
    | 'stages'
    | 'activity'
    | 'openPipeline'
    | 'openCount'
    | 'wonCount'
    | 'wonAmount'
    | 'lostCount'
    | 'lostAmount'
    | 'wonThisMonthCount'
    | 'wonThisMonthAmount'
    | 'topDeals'
  >;
};
