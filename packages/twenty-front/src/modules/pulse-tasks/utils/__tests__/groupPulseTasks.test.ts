import { type PulseTask } from '@/pulse-tasks/types/PulseTask';
import { groupPulseTasks } from '@/pulse-tasks/utils/groupPulseTasks';

const buildTask = (overrides: Partial<PulseTask>): PulseTask => ({
  id: overrides.title ?? 'task',
  title: 'task',
  status: 'TODO',
  dueAt: null,
  createdAt: new Date('2026-10-01T00:00:00'),
  assigneeId: null,
  assigneeName: null,
  priority: null,
  target: null,
  ...overrides,
});

describe('groupPulseTasks', () => {
  const now = new Date('2026-10-29T12:00:00');

  it('sorts tasks into overdue, today, upcoming, someday and done', () => {
    const groups = groupPulseTasks(
      [
        buildTask({ title: 'late', dueAt: new Date('2026-10-28T09:00:00') }),
        buildTask({ title: 'tonight', dueAt: new Date('2026-10-29T20:00:00') }),
        buildTask({
          title: 'next week',
          dueAt: new Date('2026-11-04T09:00:00'),
        }),
        buildTask({ title: 'whenever' }),
        buildTask({ title: 'finished', status: 'DONE' }),
      ],
      now,
    );

    expect(groups.overdue.map((task) => task.title)).toEqual(['late']);
    expect(groups.today.map((task) => task.title)).toEqual(['tonight']);
    expect(groups.upcoming.map((task) => task.title)).toEqual(['next week']);
    expect(groups.someday.map((task) => task.title)).toEqual(['whenever']);
    expect(groups.done.map((task) => task.title)).toEqual(['finished']);
  });

  it('puts urgent tasks first within a group', () => {
    const groups = groupPulseTasks(
      [
        buildTask({ title: 'early', dueAt: new Date('2026-10-29T13:00:00') }),
        buildTask({
          title: 'urgent',
          dueAt: new Date('2026-10-29T18:00:00'),
          priority: 'URGENT',
        }),
      ],
      now,
    );

    expect(groups.today.map((task) => task.title)).toEqual(['urgent', 'early']);
  });
});
