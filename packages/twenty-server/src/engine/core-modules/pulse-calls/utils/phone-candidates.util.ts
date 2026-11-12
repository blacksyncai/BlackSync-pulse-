import { isNonEmptyString } from '@sniptt/guards';

// Matches how phone numbers are stored on people: the full international number and
// the national number without the calling code.
export const toPhoneCandidates = (phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, '');

  return [...new Set([digits, digits.slice(-10)].filter(isNonEmptyString))];
};
