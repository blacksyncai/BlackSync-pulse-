export type TaskReminderKind = 'assigned' | 'due';

export type TaskReminderEmailInput = {
  kind: TaskReminderKind;
  taskTitle: string;
  dueAt: Date | null;
  isUrgent: boolean;
  timeZone: string;
  link: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const isValidTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });

    return true;
  } catch {
    return false;
  }
};

export const formatReminderDueDate = (dueAt: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: isValidTimeZone(timeZone) ? timeZone : 'UTC',
    timeZoneName: 'short',
  }).format(dueAt);

export const buildTaskReminderEmail = ({
  kind,
  taskTitle,
  dueAt,
  isUrgent,
  timeZone,
  link,
}: TaskReminderEmailInput) => {
  const title =
    taskTitle.trim().length > 0 ? taskTitle.trim() : 'Untitled task';
  const prefix = isUrgent ? 'Urgent: ' : '';
  const subject =
    kind === 'assigned'
      ? `${prefix}New task for you: ${title}`
      : `${prefix}Task due soon: ${title}`;
  const dueLine =
    dueAt === null
      ? 'No due date'
      : `Due ${formatReminderDueDate(dueAt, timeZone)}`;
  const intro =
    kind === 'assigned'
      ? 'A task was assigned to you.'
      : 'A task of yours is due soon.';

  const text = `${intro}\n\n${prefix}${title}\n${dueLine}\n\nOpen your to-do list: ${link}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
<p style="margin:0 0 16px;color:#555">${escapeHtml(intro)}</p>
<div style="border:1px solid #e5e5e5;border-radius:12px;padding:16px">
${isUrgent ? '<span style="display:inline-block;background:#fde2e1;color:#b42318;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:600;margin-bottom:8px">Urgent</span>' : ''}
<div style="font-size:16px;font-weight:600">${escapeHtml(title)}</div>
<div style="font-size:14px;color:#666;margin-top:4px">${escapeHtml(dueLine)}</div>
</div>
<a href="${escapeHtml(link)}" style="display:inline-block;margin-top:20px;background:#6d4aff;color:#fff;text-decoration:none;border-radius:10px;padding:10px 18px;font-weight:600">Open to-do list</a>
</div>`;

  return { subject, text, html };
};
