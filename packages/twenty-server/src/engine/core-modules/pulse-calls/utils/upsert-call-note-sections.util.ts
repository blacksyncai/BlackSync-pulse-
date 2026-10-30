const SUMMARY_HEADING = '**Summary**';
const TRANSCRIPT_HEADING = '**Transcript**';

const sectionStart = (lines: string[], heading: string) =>
  lines.findIndex((line) => line.trim() === heading);

export const extractCallNoteSection = (
  markdown: string,
  heading: 'summary' | 'transcript',
): string | null => {
  const lines = markdown.split('\n');
  const start = sectionStart(
    lines,
    heading === 'summary' ? SUMMARY_HEADING : TRANSCRIPT_HEADING,
  );

  if (start === -1) {
    return null;
  }

  const nextHeading = lines.findIndex(
    (line, index) =>
      index > start &&
      (line.trim() === SUMMARY_HEADING || line.trim() === TRANSCRIPT_HEADING),
  );

  return lines
    .slice(start + 1, nextHeading === -1 ? undefined : nextHeading)
    .join('\n')
    .trim();
};

// Summary and transcript always live at the end of the call note, summary first, and
// writing either one replaces the earlier version instead of stacking duplicates.
export const upsertCallNoteSections = (
  markdown: string,
  sections: { summary?: string | null; transcript?: string | null },
) => {
  const summary =
    sections.summary ?? extractCallNoteSection(markdown, 'summary');
  const transcript =
    sections.transcript ?? extractCallNoteSection(markdown, 'transcript');
  const lines = markdown.split('\n');
  const firstSection = [
    sectionStart(lines, SUMMARY_HEADING),
    sectionStart(lines, TRANSCRIPT_HEADING),
  ]
    .filter((index) => index !== -1)
    .sort((left, right) => left - right)[0];
  const header = (
    firstSection === undefined
      ? markdown
      : lines.slice(0, firstSection).join('\n')
  ).trim();

  return [
    header,
    summary ? `${SUMMARY_HEADING}\n\n${summary}` : null,
    transcript ? `${TRANSCRIPT_HEADING}\n\n${transcript}` : null,
  ]
    .filter((part): part is string => !!part && part.length > 0)
    .join('\n\n');
};
