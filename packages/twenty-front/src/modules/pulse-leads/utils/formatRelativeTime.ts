const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const formatRelativeTime = (value: string | null, now: number) => {
  if (value === null) {
    return null;
  }

  const difference = now - new Date(value).getTime();
  const absolute = Math.abs(difference);
  const suffix = difference >= 0 ? 'ago' : 'from now';

  if (absolute < HOUR_MS) {
    return `${Math.max(1, Math.round(absolute / MINUTE_MS))}m ${suffix}`;
  }

  if (absolute < DAY_MS) {
    return `${Math.round(absolute / HOUR_MS)}h ${suffix}`;
  }

  if (absolute < 60 * DAY_MS) {
    return `${Math.round(absolute / DAY_MS)}d ${suffix}`;
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatCompactMoney = (micros: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: micros >= 1e12 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(micros / 1_000_000);
