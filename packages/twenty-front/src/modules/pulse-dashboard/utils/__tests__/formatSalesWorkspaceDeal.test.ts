import {
  formatSalesWorkspaceAmount,
  getSalesWorkspaceCloseDate,
} from '../formatSalesWorkspaceDeal';

describe('sales workspace deal context', () => {
  it('keeps a calendar close date on the same local day', () => {
    const date = getSalesWorkspaceCloseDate('2026-11-07T00:00:00.000Z');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(7);
    expect(date?.getHours()).toBe(0);
  });
  it('handles missing and invalid dates', () => {
    expect(getSalesWorkspaceCloseDate(null)).toBeNull();
    expect(getSalesWorkspaceCloseDate('invalid')).toBeNull();
  });
  it('uses the deal currency and micros, including zero', () => {
    expect(
      formatSalesWorkspaceAmount(
        { amountMicros: 123_000_000, currencyCode: 'EUR' },
        'en-US',
      ),
    ).toBe('€123');
    expect(
      formatSalesWorkspaceAmount(
        { amountMicros: 0, currencyCode: 'USD' },
        'en-US',
      ),
    ).toBe('$0');
  });
  it('never invents a dollar value when currency or amount is unknown', () => {
    expect(formatSalesWorkspaceAmount(null)).toBe('—');
    expect(
      formatSalesWorkspaceAmount({ amountMicros: null, currencyCode: 'USD' }),
    ).toBe('—');
    expect(
      formatSalesWorkspaceAmount({ amountMicros: 200, currencyCode: null }),
    ).toBe('—');
    expect(
      formatSalesWorkspaceAmount({
        amountMicros: 200,
        currencyCode: 'invalid',
      }),
    ).toBe('—');
  });
});
