import { getSpeakerTalkShares } from '@/pulse-record/utils/getSpeakerTalkShares';

describe('getSpeakerTalkShares', () => {
  it('splits talk time between voices', () => {
    expect(
      getSpeakerTalkShares([
        { speaker: 'A', text: 'x', start: 0, end: 30 },
        { speaker: 'B', text: 'y', start: 30, end: 40 },
        { speaker: 'A', text: 'z', start: 40, end: 50 },
      ]),
    ).toEqual([
      { speaker: 'A', share: 80 },
      { speaker: 'B', share: 20 },
    ]);
  });
});
