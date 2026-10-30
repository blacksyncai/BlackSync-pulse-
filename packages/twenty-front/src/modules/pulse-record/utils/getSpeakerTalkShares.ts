import { type PulseTranscriptLine } from '@/pulse-record/utils/parsePulseCallBody';

// Talk time per voice, from each turn's start and end (or the next turn's start).
export const getSpeakerTalkShares = (lines: PulseTranscriptLine[]) => {
  const seconds = new Map<string, number>();

  lines.forEach((line, index) => {
    if (line.speaker === null || line.start === null) {
      return;
    }

    const end = line.end ?? lines[index + 1]?.start ?? line.start;

    seconds.set(
      line.speaker,
      (seconds.get(line.speaker) ?? 0) + Math.max(0, end - line.start),
    );
  });

  const total = [...seconds.values()].reduce((sum, value) => sum + value, 0);

  return [...seconds.entries()].map(([speaker, value]) => ({
    speaker,
    share: total === 0 ? 0 : Math.round((value / total) * 100),
  }));
};
