export const formatPulseTaskDue = (dueAt: Date, now: Date) => {
  const sameDay = (left: Date, right: Date) =>
    left.toDateString() === right.toDateString();
  const tomorrow = new Date(now);

  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = dueAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (sameDay(dueAt, now)) {
    return `Today ${time}`;
  }

  if (sameDay(dueAt, tomorrow)) {
    return `Tomorrow ${time}`;
  }

  return dueAt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(dueAt.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
};
