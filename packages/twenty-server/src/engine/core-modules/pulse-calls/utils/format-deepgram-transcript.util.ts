type DeepgramUtterance = {
  speaker?: number;
  transcript?: string;
  start?: number;
  end?: number;
};

export type DeepgramResponse = {
  results?: {
    utterances?: DeepgramUtterance[];
    channels?: { alternatives?: { transcript?: string }[] }[];
  };
};

const formatTimestamp = (seconds: number | undefined) => {
  const total = Math.max(0, Math.floor(seconds ?? 0));

  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// Each turn keeps its speaker and start/end time so the call card can draw talk-time
// bars and jump the recording to any line.
export const formatDeepgramTranscript = (
  response: DeepgramResponse,
): string | null => {
  const utterances = response.results?.utterances ?? [];

  if (utterances.length > 0) {
    const lines = utterances
      .filter((utterance) => (utterance.transcript ?? '').trim().length > 0)
      .map(
        (utterance) =>
          `**Speaker ${(utterance.speaker ?? 0) + 1}** [${formatTimestamp(utterance.start)}-${formatTimestamp(utterance.end)}]: ${utterance.transcript?.trim()}`,
      );

    return lines.length > 0 ? lines.join('\n\n') : null;
  }

  const transcript =
    response.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ??
    '';

  return transcript.length > 0 ? transcript : null;
};
