import { isNonEmptyString } from '@sniptt/guards';

export const FOLLOWUP_OUTCOME_LABELS: Record<string, string> = {
  answered: 'Answered',
  'no-answer': 'No answer',
  busy: 'Busy',
  failed: 'Failed',
  voicemail: 'Voicemail',
  canceled: 'Canceled',
};

const INTEREST_DUE_HOURS: Record<string, number> = {
  high: 4,
  medium: 24,
  low: 72,
};

export type FollowUpDecisionInput = {
  outcome: string;
  interest?: string | null;
  nextStep?: string | null;
};

// A follow-up task is worth creating when the caller explicitly scheduled one, when a
// voicemail was left, or when an answered call showed prospect interest.
export const shouldCreateFollowUpTask = ({
  outcome,
  interest,
  nextStep,
}: FollowUpDecisionInput): boolean => {
  if (isNonEmptyString(nextStep)) return true;
  if (outcome === 'voicemail') return true;
  if (outcome === 'answered' && isNonEmptyString(interest) && interest !== 'none')
    return true;

  return false;
};

export type FollowUpTaskDraft = {
  title: string;
  bodyMarkdown: string;
  dueAt: Date;
};

export const buildFollowUpTask = ({
  contactLabel,
  phoneNumber,
  direction,
  outcome,
  interest,
  nextStep,
  nextStepDueAt,
  summary,
}: {
  contactLabel: string;
  phoneNumber: string;
  direction: string;
  outcome: string;
  interest?: string | null;
  nextStep?: string | null;
  nextStepDueAt?: string | null;
  summary?: string | null;
}): FollowUpTaskDraft => {
  const outcomeLabel = FOLLOWUP_OUTCOME_LABELS[outcome] ?? outcome;
  const dueAt = isNonEmptyString(nextStepDueAt)
    ? new Date(nextStepDueAt)
    : new Date(
        Date.now() +
          (INTEREST_DUE_HOURS[interest ?? ''] ?? 24) * 60 * 60 * 1000,
      );

  const title = `Follow up with ${contactLabel} after ${direction} call (${outcomeLabel})`;

  const bodyMarkdown = [
    `Phone: ${phoneNumber}`,
    `Outcome: ${outcomeLabel}${isNonEmptyString(interest) ? ` · Interest: ${interest}` : ''}`,
    isNonEmptyString(nextStep) ? `**Next step**\n${nextStep}` : null,
    isNonEmptyString(summary)
      ? `**Call summary**\n${summary!.slice(0, 4000)}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return { title: title.slice(0, 250), bodyMarkdown, dueAt };
};
