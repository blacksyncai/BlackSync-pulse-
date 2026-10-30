import { type PulseTranscriptLine } from '@/pulse-record/utils/parsePulseCallBody';

const GENERIC_SPEAKER = /^speaker \d+$/i;

// Recordings label voices "Speaker 1/2" in order of first words. On an outbound call
// the person called usually speaks first ("Hello?"); on an inbound call the rep does.
export const nameCallSpeakers = (
  lines: PulseTranscriptLine[],
  {
    direction,
    contactName,
    repName,
  }: {
    direction: 'inbound' | 'outbound' | null;
    contactName: string | null;
    repName: string | null;
  },
): Map<string, string> => {
  const order: string[] = [];

  for (const line of lines) {
    if (line.speaker !== null && !order.includes(line.speaker)) {
      order.push(line.speaker);
    }
  }

  const names = new Map<string, string>();
  const contact = contactName ?? 'Contact';
  const rep = repName ?? 'You';
  const firstIsContact = direction !== 'inbound';

  order.forEach((speaker, index) => {
    if (!GENERIC_SPEAKER.test(speaker) || order.length > 2) {
      names.set(speaker, speaker);

      return;
    }

    const isContact = firstIsContact ? index === 0 : index === 1;

    names.set(speaker, isContact ? contact : rep);
  });

  return names;
};
