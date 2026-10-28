import { formatDeepgramTranscript } from 'src/engine/core-modules/pulse-calls/utils/format-deepgram-transcript.util';

describe('formatDeepgramTranscript', () => {
  it('labels each speaker turn', () => {
    expect(
      formatDeepgramTranscript({
        results: {
          utterances: [
            { speaker: 0, transcript: 'Hi, this is Hamza.' },
            { speaker: 1, transcript: ' Hey Hamza. ' },
          ],
        },
      }),
    ).toBe('**Speaker 1:** Hi, this is Hamza.\n\n**Speaker 2:** Hey Hamza.');
  });

  it('falls back to the plain transcript', () => {
    expect(
      formatDeepgramTranscript({
        results: { channels: [{ alternatives: [{ transcript: 'Hello' }] }] },
      }),
    ).toBe('Hello');
  });

  it('returns null for silence', () => {
    expect(
      formatDeepgramTranscript({ results: { utterances: [] } }),
    ).toBeNull();
  });
});
