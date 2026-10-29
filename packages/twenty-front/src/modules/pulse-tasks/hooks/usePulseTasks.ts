import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { usePulseTaskPriorityField } from '@/pulse-tasks/hooks/usePulseTaskPriorityField';
import { type PulseTask } from '@/pulse-tasks/types/PulseTask';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const DONE_VISIBLE_DAYS = 7;

type FullName = { firstName: string | null; lastName: string | null } | null;

type TaskRecord = ObjectRecord & {
  title: string | null;
  status: string | null;
  dueAt: string | null;
  createdAt: string;
  assigneeId: string | null;
  assignee: { name: FullName } | null;
  priority?: string | null;
  taskTargets: {
    targetCompany: { id: string; name: string | null } | null;
    targetPerson: { id: string; name: FullName } | null;
  }[];
};

const formatName = (name: FullName) =>
  [name?.firstName, name?.lastName].filter(Boolean).join(' ') || null;

export const usePulseTasks = ({
  assigneeId,
}: { assigneeId?: string | null } = {}) => {
  const { hasPriority } = usePulseTaskPriorityField();
  const doneSince = useMemo(
    () =>
      new Date(
        Date.now() - DONE_VISIBLE_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    [],
  );

  const { records, loading, refetch } = useFindManyRecords<TaskRecord>({
    objectNameSingular: CoreObjectNameSingular.Task,
    filter: {
      and: [
        {
          or: [
            { status: { neq: 'DONE' } },
            { status: { is: 'NULL' } },
            { updatedAt: { gte: doneSince } },
          ],
        },
        ...(isDefined(assigneeId) ? [{ assigneeId: { eq: assigneeId } }] : []),
      ],
    },
    orderBy: [{ dueAt: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      createdAt: true,
      assigneeId: true,
      assignee: { name: { firstName: true, lastName: true } },
      ...(hasPriority ? { priority: true } : {}),
      taskTargets: {
        targetCompany: { id: true, name: true },
        targetPerson: { id: true, name: { firstName: true, lastName: true } },
      },
    },
    limit: 500,
  });

  const tasks = useMemo<PulseTask[]>(
    () =>
      records.map((record) => {
        const company = record.taskTargets?.find((target) =>
          isDefined(target.targetCompany),
        )?.targetCompany;
        const person = record.taskTargets?.find((target) =>
          isDefined(target.targetPerson),
        )?.targetPerson;

        return {
          id: record.id,
          title: record.title ?? '',
          status: record.status,
          dueAt: isDefined(record.dueAt) ? new Date(record.dueAt) : null,
          createdAt: new Date(record.createdAt),
          assigneeId: record.assigneeId,
          assigneeName: formatName(record.assignee?.name ?? null),
          priority: record.priority ?? null,
          target:
            isDefined(company) || isDefined(person)
              ? {
                  companyId: company?.id ?? null,
                  companyName: company?.name ?? null,
                  personId: person?.id ?? null,
                  personName: formatName(person?.name ?? null),
                }
              : null,
        };
      }),
    [records],
  );

  return { tasks, loading, refetch };
};
