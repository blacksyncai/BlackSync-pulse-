import { type PulseTask } from '@/pulse-tasks/types/PulseTask';
import { isPulseTaskDone } from '@/pulse-tasks/utils/groupPulseTasks';

const ALERT_AHEAD_MS = 5 * 60 * 1000;
// Opening the app after a task came due still alerts once, but not for stale backlog.
const ALERT_LATE_MS = 60 * 60 * 1000;

export const getTaskAlertKey = (task: PulseTask) =>
  `${task.id}:${task.dueAt?.getTime() ?? 0}`;

export const getDueTaskAlerts = (
  tasks: PulseTask[],
  now: number,
  alreadyNotified: Set<string>,
) =>
  tasks.filter(
    (task) =>
      !isPulseTaskDone(task) &&
      task.dueAt !== null &&
      task.dueAt.getTime() <= now + ALERT_AHEAD_MS &&
      task.dueAt.getTime() >= now - ALERT_LATE_MS &&
      !alreadyNotified.has(getTaskAlertKey(task)),
  );

export const isTaskNeedingAttention = (task: PulseTask, now: number) =>
  !isPulseTaskDone(task) &&
  task.dueAt !== null &&
  task.dueAt.getTime() <= now + ALERT_LATE_MS;
