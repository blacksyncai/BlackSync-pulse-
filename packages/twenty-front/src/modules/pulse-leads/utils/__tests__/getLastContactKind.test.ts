import { getLastContactKind } from '@/pulse-leads/utils/getLastContactKind';

describe('getLastContactKind', () => {
  it('recognises calls, emails, texts and notes from their titles', () => {
    expect(getLastContactKind('Outbound call · 2m 5s · Answered')).toBe('call');
    expect(getLastContactKind('Email received: Re: pricing')).toBe(
      'email-received',
    );
    expect(getLastContactKind('Email sent: Quick question')).toBe('email-sent');
    expect(getLastContactKind('Text sent')).toBe('text');
    expect(getLastContactKind('Met at conference')).toBe('note');
    expect(getLastContactKind(null)).toBeNull();
  });
});
