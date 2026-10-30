import { nameCallSpeakers } from '@/pulse-record/utils/nameCallSpeakers';

const line = (speaker: string) => ({ speaker, text: 'x', start: 0, end: 1 });

describe('nameCallSpeakers', () => {
  it('names the person called as the first voice on an outbound call', () => {
    const names = nameCallSpeakers([line('Speaker 2'), line('Speaker 1')], {
      direction: 'outbound',
      contactName: 'Matthew Holt',
      repName: 'Hamza Basal',
    });

    expect(names.get('Speaker 2')).toBe('Matthew Holt');
    expect(names.get('Speaker 1')).toBe('Hamza Basal');
  });

  it('keeps real names and falls back to generic labels', () => {
    const names = nameCallSpeakers([line('Agent'), line('Speaker 1')], {
      direction: 'inbound',
      contactName: null,
      repName: null,
    });

    expect(names.get('Agent')).toBe('Agent');
    expect(names.get('Speaker 1')).toBe('Contact');
  });
});
