import {
  type PulseTask,
  type PulseTaskGroupId,
} from '@/pulse-tasks/types/PulseTask';

export const PULSE_URGENT_PRIORITY = 'URGENT';

export const isPulseTaskDone = (task: PulseTask) => task.status === 'DONE';

const PRIORITY_RANK: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

const compareTasks = (left: PulseTask, right: PulseTask) => {
  const rank = (task: PulseTask) => PRIORITY_RANK[task.priority ?? ''] ?? 2;

  if (rank(left) !== rank(right)) {
    return rank(left) - rank(right);
  }

  return (
    (left.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (right.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
};

export const getPulseTaskGroupId = (
  task: PulseTask,
  now: Date,
): PulseTaskGroupId => {
  if (isPulseTaskDone(task)) {
    return 'done';
  }

  if (task.dueAt === null) {
    return 'someday';
  }

  const endOfToday = new Date(now);

  endOfToday.setHours(23, 59, 59, 999);

  if (task.dueAt.getTime() < now.getTime()) {
    return 'overdue';
  }

  return task.dueAt.getTime() <= endOfToday.getTime() ? 'today' : 'upcoming';
};

export const groupPulseTasks = (tasks: PulseTask[], now: Date) => {
  const groups: Record<PulseTaskGroupId, PulseTask[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    someday: [],
    done: [],
  };

  for (const task of tasks) {
    groups[getPulseTaskGroupId(task, now)].push(task);
  }

  for (const groupId of Object.keys(groups) as PulseTaskGroupId[]) {
    groups[groupId].sort(compareTasks);
  }

  groups.done.reverse();

  return groups;
};
