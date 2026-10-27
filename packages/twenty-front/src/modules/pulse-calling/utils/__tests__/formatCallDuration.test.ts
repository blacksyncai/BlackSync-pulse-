import { formatCallDuration } from '@/pulse-calling/utils/formatCallDuration';

describe('formatCallDuration', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatCallDuration(0)).toBe('0:00');
    expect(formatCallDuration(9_400)).toBe('0:09');
    expect(formatCallDuration(754_000)).toBe('12:34');
  });
});
