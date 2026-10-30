export type PulseCallFact = { label: string; value: string };
export type PulseCallLink = { label: string; url: string };
export type PulseTranscriptLine = {
  speaker: string | null;
  text: string;
  start: number | null;
  end: number | null;
};

export type PulseCallBody = {
  aiSummary: string[];
  summary: string;
  facts: PulseCallFact[];
  links: PulseCallLink[];
  transcript: PulseTranscriptLine[];
};

const TRANSCRIPT_HEADING = /^\**\s*transcript\s*\**:?\s*$/i;
const SUMMARY_HEADING = /^\*\*\s*summary\s*\*\*:?\s*$/i;
const TIMED_LINE =
  /^\*\*(.+?)\*\*\s*\[(\d+):(\d{2})(?:-(\d+):(\d{2}))?\]:\s*(.+)$/;
const FACT_LINE = /^([A-Za-z][\w '/()-]{0,40}):\s+(.+)$/;
const SPEAKER_LINE = /^\**([^*:\n]{1,40}?):\**\s*(.+)$/;
const URL = /(https?:\/\/\S+)/;
const BLACKSYNC_CALL = /blacksync\.si\/calls/i;

const linkLabel = (key: string, url: string) =>
  BLACKSYNC_CALL.test(url) ? 'Open in BlackSync' : key || 'Open link';

// Call notes mix a written summary, "Key: value" details from the dialer or AI agent,
// links, and an optional transcript; each gets its own tab on the call card.
export const parsePulseCallBody = (markdown: string): PulseCallBody => {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const transcriptStart = lines.findIndex((line) =>
    TRANSCRIPT_HEADING.test(line.trim()),
  );
  const summaryStart = lines.findIndex((line) =>
    SUMMARY_HEADING.test(line.trim()),
  );
  const firstSection = [transcriptStart, summaryStart]
    .filter((index) => index !== -1)
    .sort((left, right) => left - right)[0];
  const headerLines =
    firstSection === undefined ? lines : lines.slice(0, firstSection);
  const transcriptLines =
    transcriptStart === -1 ? [] : lines.slice(transcriptStart + 1);
  const aiSummary =
    summaryStart === -1
      ? []
      : lines
          .slice(
            summaryStart + 1,
            transcriptStart > summaryStart ? transcriptStart : undefined,
          )
          .map((line) => line.trim().replace(/^[-*•]\s*/, ''))
          .filter((line) => line.length > 0);

  const summary: string[] = [];
  const facts: PulseCallFact[] = [];
  const links: PulseCallLink[] = [];

  for (const rawLine of headerLines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      if (summary.length > 0 && summary[summary.length - 1] !== '') {
        summary.push('');
      }
      continue;
    }

    const url = line.match(URL)?.[1];

    if (url !== undefined) {
      links.push({
        label: linkLabel(line.replace(URL, '').replace(/[:\s]+$/, ''), url),
        url,
      });
      continue;
    }

    const loggedBy = line.match(/^Logged by (.+)$/i);

    if (loggedBy !== null) {
      facts.push({ label: 'Logged by', value: loggedBy[1] });
      continue;
    }

    const fact = line.match(FACT_LINE);

    // Long sentences that happen to contain a colon stay in the summary.
    if (fact !== null && fact[2].length <= 160) {
      facts.push({ label: fact[1].trim(), value: fact[2].trim() });
      continue;
    }

    summary.push(line);
  }

  const transcript: PulseTranscriptLine[] = [];

  for (const rawLine of transcriptLines) {
    const line = rawLine.trim();

    if (line.length === 0) {
      continue;
    }

    const timed = line.match(TIMED_LINE);

    if (timed !== null) {
      transcript.push({
        speaker: timed[1].trim(),
        start: Number(timed[2]) * 60 + Number(timed[3]),
        end:
          timed[4] !== undefined
            ? Number(timed[4]) * 60 + Number(timed[5])
            : null,
        text: timed[6].trim(),
      });
      continue;
    }

    const speaker = line.match(SPEAKER_LINE);

    transcript.push(
      speaker !== null
        ? {
            speaker: speaker[1].trim(),
            text: speaker[2].trim(),
            start: null,
            end: null,
          }
        : { speaker: null, text: line, start: null, end: null },
    );
  }

  return {
    aiSummary,
    summary: summary.join('\n').trim(),
    facts,
    links,
    transcript,
  };
};
