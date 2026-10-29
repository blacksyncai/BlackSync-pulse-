import { parsePulseCallBody } from '@/pulse-record/utils/parsePulseCallBody';

describe('parsePulseCallBody', () => {
  it('splits an AI agent call into summary, details and links', () => {
    const body = parsePulseCallBody(
      [
        'BlackSync AI call: Meeting booked',
        'Agent: Mortgage Outreach · Sofia · Duration 2:54',
        '',
        'The agent introduced BlackSync AI. They confirmed an appointment for Friday at 10:30 and provided an email.',
        '',
        'Interest level: interested',
        ' successful: True',
        '',
        'Call details and recording: https://blacksync.si/calls/537a8345',
        '',
        'Phone: +12533707008',
        '',
        'Logged by Hamza Basal in Close',
      ].join('\n'),
    );

    expect(body.summary).toBe(
      'The agent introduced BlackSync AI. They confirmed an appointment for Friday at 10:30 and provided an email.',
    );
    expect(body.facts).toEqual([
      { label: 'BlackSync AI call', value: 'Meeting booked' },
      { label: 'Agent', value: 'Mortgage Outreach · Sofia · Duration 2:54' },
      { label: 'Interest level', value: 'interested' },
      { label: 'successful', value: 'True' },
      { label: 'Phone', value: '+12533707008' },
      { label: 'Logged by', value: 'Hamza Basal in Close' },
    ]);
    expect(body.links).toEqual([
      {
        label: 'Open in BlackSync',
        url: 'https://blacksync.si/calls/537a8345',
      },
    ]);
    expect(body.transcript).toEqual([]);
  });

  it('reads the transcript section as speaker lines', () => {
    const body = parsePulseCallBody(
      'Phone: +1555\n\n**Transcript**\n\n**Speaker 1:** Hi there\n\n**Speaker 2:** Who is this?\n\nunlabelled tail',
    );

    expect(body.facts).toEqual([{ label: 'Phone', value: '+1555' }]);
    expect(body.transcript).toEqual([
      { speaker: 'Speaker 1', text: 'Hi there' },
      { speaker: 'Speaker 2', text: 'Who is this?' },
      { speaker: null, text: 'unlabelled tail' },
    ]);
  });
});
