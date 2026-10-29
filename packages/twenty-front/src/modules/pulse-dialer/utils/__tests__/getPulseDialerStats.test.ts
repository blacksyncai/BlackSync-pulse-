import { PULSE_DIALER_EMPTY_SESSION } from '@/pulse-dialer/states/pulseDialerSessionState';
import {
  formatTalkTime,
  getPulseDialerStats,
} from '@/pulse-dialer/utils/getPulseDialerStats';

describe('getPulseDialerStats', () => {
  it('counts dials, connects and talk time but not skipped leads', () => {
    const lead = (id: string) => ({
      companyId: id,
      personId: null,
      leadName: id,
      contactName: id,
      phone: '+1555',
    });
    const stats = getPulseDialerStats({
      ...PULSE_DIALER_EMPTY_SESSION,
      queue: ['a', 'b', 'c', 'd', 'e'].map(lead),
      index: 4,
      results: {
        a: { disposition: 'interested', at: 1, talkSeconds: 120 },
        b: { disposition: 'no_answer', at: 2, talkSeconds: 0 },
        c: { disposition: 'skipped', at: 3, talkSeconds: 0 },
        d: { disposition: 'voicemail', at: 4, talkSeconds: 30 },
      },
    });

    expect(stats).toEqual({
      dialed: 3,
      connected: 1,
      connectRate: 33,
      talkSeconds: 150,
      remaining: 1,
    });
    expect(formatTalkTime(150)).toBe('2m 30s');
    expect(formatTalkTime(3725)).toBe('1h 2m');
  });
});
