export type PulseLastContactKind =
  | 'call'
  | 'email-sent'
  | 'email-received'
  | 'text'
  | 'note';

// Activity titles follow the patterns the Close import and Pulse use when logging.
export const getLastContactKind = (
  title: string | null,
): PulseLastContactKind | null => {
  if (title === null) {
    return null;
  }

  if (/call ·|^(outbound|inbound) call/i.test(title)) {
    return 'call';
  }

  if (/^email received/i.test(title)) {
    return 'email-received';
  }

  if (/^email sent/i.test(title)) {
    return 'email-sent';
  }

  if (/^text (sent|received)/i.test(title)) {
    return 'text';
  }

  return 'note';
};
