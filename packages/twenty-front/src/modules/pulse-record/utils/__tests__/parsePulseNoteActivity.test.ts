import { parsePulseNoteActivity } from '@/pulse-record/utils/parsePulseNoteActivity';

describe('parsePulseNoteActivity', () => {
  it('turns an imported call note into a call with its recording', () => {
    const activity = parsePulseNoteActivity(
      'Outbound call · 8m 47s · Answered',
      'Talked pricing\n\nPhone: +14155550123\n\n[Call recording](https://example.com/rec.mp3)',
    );

    expect(activity).toMatchObject({
      kind: 'call',
      title: 'Outbound call',
      direction: 'outbound',
      duration: '8m 47s',
      outcome: 'Answered',
      recordingUrl: 'https://example.com/rec.mp3',
      body: 'Talked pricing\n\nPhone: +14155550123',
    });
  });

  it('recognizes received emails and texts', () => {
    expect(
      parsePulseNoteActivity('Email received: AI Contract Questions', 'Hi'),
    ).toMatchObject({
      kind: 'email',
      title: 'AI Contract Questions',
      direction: 'inbound',
    });
    expect(parsePulseNoteActivity('Text sent', 'On my way')).toMatchObject({
      kind: 'sms',
      direction: 'outbound',
    });
  });

  it('keeps everything else as a note', () => {
    expect(
      parsePulseNoteActivity('Friday call structure', 'Goal for the call'),
    ).toMatchObject({ kind: 'note', title: 'Friday call structure' });
  });
});
