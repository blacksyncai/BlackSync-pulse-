import {
  extractCallNoteSection,
  upsertCallNoteSections,
} from 'src/engine/core-modules/pulse-calls/utils/upsert-call-note-sections.util';

describe('upsertCallNoteSections', () => {
  const note =
    'Phone: +1555\n\n**Transcript**\n\n**Speaker 1** [0:01-0:03]: Hi';

  it('adds a summary above an existing transcript', () => {
    expect(upsertCallNoteSections(note, { summary: '- Booked a demo' })).toBe(
      'Phone: +1555\n\n**Summary**\n\n- Booked a demo\n\n**Transcript**\n\n**Speaker 1** [0:01-0:03]: Hi',
    );
  });

  it('replaces sections instead of duplicating them', () => {
    const once = upsertCallNoteSections(note, { summary: '- First' });
    const twice = upsertCallNoteSections(once, {
      summary: '- Second',
      transcript: '**Speaker 1** [0:00-0:01]: Hello',
    });

    expect(twice).toBe(
      'Phone: +1555\n\n**Summary**\n\n- Second\n\n**Transcript**\n\n**Speaker 1** [0:00-0:01]: Hello',
    );
    expect(extractCallNoteSection(twice, 'transcript')).toBe(
      '**Speaker 1** [0:00-0:01]: Hello',
    );
  });
});
