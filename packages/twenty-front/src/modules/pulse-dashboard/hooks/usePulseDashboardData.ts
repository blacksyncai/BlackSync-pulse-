import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { usePulsePipelines } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { buildPulseBoardFilter } from '@/pulse-opportunities/utils/buildPulseBoardFilter';
import {
  buildPulseAnalytics,
  type AnalyticsOpportunity,
} from '@/pulse-dashboard/utils/buildPulseAnalytics';
import { type PulseDashboardData } from '@/pulse-dashboard/types/PulseDashboardData';
import { useMemo, useState } from 'react';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
export const usePulseDashboardData = (
  pipelineId = 'all',
  selectedCurrency = '',
) => {
  const { pipelines, opportunityMetadataItem } = usePulsePipelines();
  const pipeline = pipelines.find(
    (candidate) => candidate.viewId === pipelineId,
  );
  const stageFields = opportunityMetadataItem.fields.filter(
    (field) =>
      field.isActive !== false &&
      field.type === FieldMetadataType.SELECT &&
      (field.name === 'stage' ||
        field.name.endsWith('Stage') ||
        pipelines.some((pipeline) => pipeline.stageFieldName === field.name)),
  );
  const hasPipeline = opportunityMetadataItem.fields.some(
    (field) => field.name === 'pipeline',
  );
  const opportunities = useFindManyRecords<AnalyticsOpportunity & ObjectRecord>(
    {
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      recordGqlFields: {
        id: true,
        name: true,
        createdAt: true,
        closeDate: true,
        amount: { amountMicros: true, currencyCode: true },
        company: { name: true },
        ...(hasPipeline ? { pipeline: true } : {}),
        ...Object.fromEntries(stageFields.map((field) => [field.name, true])),
      },
      filter: pipeline
        ? buildPulseBoardFilter(pipeline, hasPipeline)
        : undefined,
      limit: 1000,
    },
  );
  const [now, setNow] = useState(() => new Date());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const openTasks = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFields: { id: true },
    filter: { or: [{ status: { neq: 'DONE' } }, { status: { is: 'NULL' } }] },
    limit: 1,
  });
  const overdueTasks = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFields: { id: true },
    filter: {
      and: [
        { or: [{ status: { neq: 'DONE' } }, { status: { is: 'NULL' } }] },
        { dueAt: { lt: now.toISOString() } },
      ],
    },
    limit: 1,
  });
  const nextTasks = useFindManyRecords<
    ObjectRecord & { title: string | null; dueAt: string | null }
  >({
    objectNameSingular: CoreObjectNameSingular.Task,
    recordGqlFields: { id: true, title: true, dueAt: true },
    filter: {
      and: [
        { or: [{ status: { neq: 'DONE' } }, { status: { is: 'NULL' } }] },
        { dueAt: { is: 'NOT_NULL' } },
      ],
    },
    orderBy: [{ dueAt: 'AscNullsLast' }],
    limit: 3,
  });
  const people = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Person,
    recordGqlFields: { id: true },
    limit: 1,
  });
  const companies = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Company,
    recordGqlFields: { id: true },
    limit: 1,
  });
  const meetings = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.CalendarEvent,
    recordGqlFields: { id: true },
    filter: {
      and: [
        { startsAt: { gte: weekStart.toISOString() } },
        { startsAt: { lt: weekEnd.toISOString() } },
      ],
    },
    limit: 1,
  });
  const todayCalls = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: { id: true },
    filter: {
      and: [
        { title: { ilike: '%call ·%' } },
        { createdAt: { gte: today.toISOString() } },
        { createdAt: { lte: now.toISOString() } },
      ],
    },
    limit: 1,
  });
  const weekCalls = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.Note,
    recordGqlFields: { id: true },
    filter: {
      and: [
        { title: { ilike: '%call ·%' } },
        { createdAt: { gte: weekStart.toISOString() } },
        { createdAt: { lte: now.toISOString() } },
      ],
    },
    limit: 1,
  });
  const currencies = useMemo(
    () =>
      [
        ...new Set(
          opportunities.records.map(
            (deal) => deal.amount?.currencyCode || 'USD',
          ),
        ),
      ].sort(),
    [opportunities.records],
  );
  const currencyCode =
    selectedCurrency ||
    (currencies.includes('USD') ? 'USD' : (currencies[0] ?? 'USD'));
  const data: PulseDashboardData = {
    ...buildPulseAnalytics(
      opportunities.records,
      pipeline ? [pipeline] : pipelines,
      currencyCode,
      now,
    ),
    dialsToday: todayCalls.totalCount ?? 0,
    dialsThisWeek: weekCalls.totalCount ?? 0,
    tasksOpen: openTasks.totalCount ?? 0,
    tasksOverdue: overdueTasks.totalCount ?? 0,
    upcomingTasks: nextTasks.records.map((task) => ({
      title: task.title || 'Untitled task',
      due: task.dueAt
        ? new Date(task.dueAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : '',
      isOverdue: task.dueAt ? new Date(task.dueAt) < now : false,
    })),
    meetingsThisWeek: meetings.totalCount ?? 0,
    peopleCount: people.totalCount ?? 0,
    companyCount: companies.totalCount ?? 0,
  };
  const sources = [
    opportunities,
    openTasks,
    overdueTasks,
    nextTasks,
    people,
    companies,
    meetings,
    todayCalls,
    weekCalls,
  ];
  return {
    data,
    pipelines,
    currencies: [...new Set([currencyCode, ...currencies])],
    currencyCode,
    loading: sources.some((source) => source.loading),
    error: sources.find((source) => source.error)?.error,
    totalCount: opportunities.totalCount,
    loadedCount: opportunities.records.length,
    hasNextPage: opportunities.hasNextPage,
    loadMore: opportunities.fetchMoreRecords,
    refresh: () => {
      setNow(new Date());
      return Promise.all(sources.map((source) => source.refetch()));
    },
  };
};
