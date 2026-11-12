import { toPhoneCandidates } from '../phone-candidates.util';

describe('toPhoneCandidates', () => {
  it('keeps the full international number and the national number without calling code', () => {
    expect(toPhoneCandidates('+15551234567')).toEqual([
      '15551234567',
      '5551234567',
    ]);
  });

  it('strips formatting and deduplicates when the number is already national', () => {
    expect(toPhoneCandidates('(555) 123-4567')).toEqual(['5551234567']);
    expect(toPhoneCandidates('+44 20 7946 0958')).toEqual([
      '442079460958',
      '2079460958',
    ]);
  });

  it('drops empty candidates for very short numbers', () => {
    expect(toPhoneCandidates('+1234')).toEqual(['1234']);
  });
});
