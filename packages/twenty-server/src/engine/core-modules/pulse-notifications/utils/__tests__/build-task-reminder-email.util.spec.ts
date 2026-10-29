import { buildTaskReminderEmail } from 'src/engine/core-modules/pulse-notifications/utils/build-task-reminder-email.util';

describe('buildTaskReminderEmail', () => {
  it('flags urgent due reminders in the subject and body', () => {
    const email = buildTaskReminderEmail({
      kind: 'due',
      taskTitle: 'Call <Acme>',
      dueAt: new Date('2026-10-29T15:00:00Z'),
      isUrgent: true,
      timeZone: 'America/New_York',
      link: 'https://acme.blacksync.cloud/todo',
    });

    expect(email.subject).toBe('Urgent: Task due soon: Call <Acme>');
    expect(email.html).toContain('Call &lt;Acme&gt;');
    expect(email.text).toContain('Due Thu, Oct 29, 11:00 AM EDT');
  });

  it('falls back to UTC for an unknown time zone', () => {
    const email = buildTaskReminderEmail({
      kind: 'assigned',
      taskTitle: '',
      dueAt: new Date('2026-10-29T15:00:00Z'),
      isUrgent: false,
      timeZone: 'system',
      link: 'https://acme.blacksync.cloud/todo',
    });

    expect(email.subject).toBe('New task for you: Untitled task');
    expect(email.text).toContain('3:00 PM UTC');
  });
});
