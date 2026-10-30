import { formatDeepgramTranscript } from 'src/engine/core-modules/pulse-calls/utils/format-deepgram-transcript.util';

describe('formatDeepgramTranscript', () => {
  it('labels each speaker turn with its start and end time', () => {
    expect(
      formatDeepgramTranscript({
        results: {
          utterances: [
            {
              speaker: 0,
              transcript: 'Hi, this is Hamza.',
              start: 1.2,
              end: 3.9,
            },
            { speaker: 1, transcript: ' Hey Hamza. ', start: 64, end: 65.5 },
          ],
        },
      }),
    ).toBe(
      '**Speaker 1** [0:01-0:03]: Hi, this is Hamza.\n\n**Speaker 2** [1:04-1:05]: Hey Hamza.',
    );
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
