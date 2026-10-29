import {
  getDueTaskAlerts,
  getTaskAlertKey,
} from '@/pulse-notifications/utils/getDueTaskAlerts';
import { type PulseTask } from '@/pulse-tasks/types/PulseTask';

const now = new Date('2026-10-29T12:00:00Z').getTime();

const buildTask = (id: string, minutesFromNow: number | null): PulseTask => ({
  id,
  title: id,
  status: 'TODO',
  dueAt:
    minutesFromNow === null ? null : new Date(now + minutesFromNow * 60000),
  createdAt: new Date(now),
  assigneeId: null,
  assigneeName: null,
  priority: null,
  target: null,
});

describe('getDueTaskAlerts', () => {
  it('alerts for tasks due within five minutes or overdue under an hour', () => {
    const alerts = getDueTaskAlerts(
      [
        buildTask('soon', 3),
        buildTask('just-late', -20),
        buildTask('later', 30),
        buildTask('stale', -180),
        buildTask('undated', null),
      ],
      now,
      new Set(),
    );

    expect(alerts.map((task) => task.id)).toEqual(['soon', 'just-late']);
  });

  it('skips tasks already alerted for the same due time', () => {
    const task = buildTask('soon', 3);

    expect(
      getDueTaskAlerts([task], now, new Set([getTaskAlertKey(task)])),
    ).toEqual([]);
  });
});
