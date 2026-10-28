type DeepgramUtterance = { speaker?: number; transcript?: string };

export type DeepgramResponse = {
  results?: {
    utterances?: DeepgramUtterance[];
    channels?: { alternatives?: { transcript?: string }[] }[];
  };
};

// Speaker-labelled lines read like a conversation; fall back to the plain transcript.
export const formatDeepgramTranscript = (
  response: DeepgramResponse,
): string | null => {
  const utterances = response.results?.utterances ?? [];

  if (utterances.length > 0) {
    const lines = utterances
      .filter((utterance) => (utterance.transcript ?? '').trim().length > 0)
      .map(
        (utterance) =>
          `**Speaker ${(utterance.speaker ?? 0) + 1}:** ${utterance.transcript?.trim()}`,
      );

    return lines.length > 0 ? lines.join('\n\n') : null;
  }

  const transcript =
    response.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ??
    '';

  return transcript.length > 0 ? transcript : null;
};
