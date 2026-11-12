import {
  buildFollowUpTask,
  shouldCreateFollowUpTask,
} from '../pulse-call-followup.util';

describe('shouldCreateFollowUpTask', () => {
  it.each([
    { outcome: 'answered', interest: 'high' },
    { outcome: 'answered', interest: 'medium' },
    { outcome: 'answered', interest: 'low' },
    { outcome: 'answered', interest: 'none', nextStep: 'Send pricing' },
    { outcome: 'no-answer', nextStep: 'Try again tomorrow' },
    { outcome: 'voicemail' },
  ])('creates a task for %o', (input) => {
    expect(shouldCreateFollowUpTask(input)).toBe(true);
  });

  it.each([
    { outcome: 'answered', interest: 'none' },
    { outcome: 'answered' },
    { outcome: 'no-answer' },
    { outcome: 'busy' },
    { outcome: 'failed' },
    { outcome: 'canceled' },
  ])('skips a task for %o', (input) => {
    expect(shouldCreateFollowUpTask(input)).toBe(false);
  });
});

describe('buildFollowUpTask', () => {
  const base = {
    contactLabel: 'Ann Example',
    phoneNumber: '+15551234567',
    direction: 'outbound',
    outcome: 'answered',
    interest: 'high',
  };

  it('uses the explicit due date when provided', () => {
    const draft = buildFollowUpTask({
      ...base,
      nextStepDueAt: '2026-11-20T15:00:00.000Z',
      nextStep: 'Send the proposal',
      summary: 'Asked about pricing',
    });

    expect(draft.dueAt).toEqual(new Date('2026-11-20T15:00:00.000Z'));
    expect(draft.title).toBe(
      'Follow up with Ann Example after outbound call (Answered)',
    );
    expect(draft.bodyMarkdown).toContain('Phone: +15551234567');
    expect(draft.bodyMarkdown).toContain('Interest: high');
    expect(draft.bodyMarkdown).toContain('**Next step**\nSend the proposal');
    expect(draft.bodyMarkdown).toContain('Asked about pricing');
  });

  it('defaults the due date from the interest level', () => {
    const before = Date.now();
    const draft = buildFollowUpTask({ ...base, interest: 'high' });
    const after = Date.now();

    expect(draft.dueAt.getTime()).toBeGreaterThanOrEqual(
      before + 4 * 60 * 60 * 1000,
    );
    expect(draft.dueAt.getTime()).toBeLessThanOrEqual(
      after + 4 * 60 * 60 * 1000,
    );
  });

  it('falls back to 24 hours without interest and truncates long summaries', () => {
    const draft = buildFollowUpTask({
      ...base,
      interest: null,
      outcome: 'voicemail',
      summary: 'x'.repeat(9000),
    });

    expect(draft.dueAt.getTime()).toBeGreaterThanOrEqual(
      Date.now() + 24 * 60 * 60 * 1000 - 1000,
    );
    expect(draft.bodyMarkdown).toContain('x'.repeat(4000));
    expect(draft.bodyMarkdown).not.toContain('x'.repeat(4001));
    expect(draft.title).toContain('Voicemail');
  });
});
