export const getSalesWorkspaceCloseDate = (value: string | null) => {
  if (!value) return null;
  // Close dates represent calendar days, independent of the viewer's timezone.
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatSalesWorkspaceAmount = (
  amount: { amountMicros: number | null; currencyCode: string | null } | null,
  locale?: string,
) => {
  if (
    amount?.amountMicros === null ||
    amount?.amountMicros === undefined ||
    !amount.currencyCode
  )
    return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: amount.currencyCode,
      maximumFractionDigits: 0,
    }).format(amount.amountMicros / 1_000_000);
  } catch {
    return '—';
  }
};
