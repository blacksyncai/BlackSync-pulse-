import {
  matchesTicketEmail,
  parseTicketEmailRule,
} from '../utils/ticket-email-rule';

const channelId = '1cc32bfa-7a93-4c36-8ca1-04c1cc196abb';
const rule = {
  enabled: true,
  enabledAt: '2026-11-09T00:00:00Z',
  keywords: ['help', 'request'],
};
describe('client ticket email rules', () => {
  it('normalizes explicit keywords', () => {
    expect(
      parseTicketEmailRule({
        channelId,
        enabled: true,
        keywords: [' HELP ', 'help', 'Request'],
      }),
    ).toEqual({ channelId, enabled: true, keywords: ['help', 'request'] });
  });
  it.each([
    null,
    {},
    { channelId, enabled: true, keywords: [] },
    { channelId, enabled: true, keywords: [''] },
    { channelId, enabled: true, keywords: [123] },
    { channelId, enabled: 'yes', keywords: ['help'] },
  ])('rejects malformed rules: %p', (input) => {
    expect(() => parseTicketEmailRule(input)).toThrow();
  });
  it('matches subject keywords without case sensitivity', () => {
    expect(
      matchesTicketEmail(
        'Please HELP with onboarding',
        new Date('2026-11-09T01:00:00Z'),
        rule,
      ),
    ).toBe(true);
    expect(
      matchesTicketEmail(
        'Weekly newsletter',
        new Date('2026-11-09T01:00:00Z'),
        rule,
      ),
    ).toBe(false);
  });
  it('does not backfill historical, undated, or disabled mail', () => {
    expect(
      matchesTicketEmail('Help', new Date('2026-11-08T01:00:00Z'), rule),
    ).toBe(false);
    expect(matchesTicketEmail('Help', null, rule)).toBe(false);
    expect(
      matchesTicketEmail('Help', new Date('2026-11-09T01:00:00Z'), {
        ...rule,
        enabled: false,
      }),
    ).toBe(false);
  });
});
