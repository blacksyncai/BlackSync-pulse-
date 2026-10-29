import {
  type PulseRecipient,
  type PulseSender,
} from 'src/engine/core-modules/pulse-outreach/types/pulse-outreach.type';

const VARIABLE_PATTERN = /\{\{\s*([a-z_]+)\s*(?:\|\s*([^}]*?)\s*)?\}\}/gi;

export const buildTemplateVariables = (
  recipient: Pick<PulseRecipient, 'firstName' | 'lastName' | 'companyName'>,
  sender: Pick<PulseSender, 'firstName' | 'lastName'>,
): Record<string, string> => ({
  first_name: recipient.firstName,
  last_name: recipient.lastName,
  full_name: [recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(' '),
  company: recipient.companyName,
  sender_first_name: sender.firstName,
  sender_name: [sender.firstName, sender.lastName].filter(Boolean).join(' '),
});

// {{first_name|there}} falls back to "there" when the contact has no first name.
export const renderPulseTemplate = (
  template: string,
  variables: Record<string, string>,
) =>
  template.replace(VARIABLE_PATTERN, (_, name: string, fallback?: string) => {
    const value = variables[name.toLowerCase()]?.trim();

    return value && value.length > 0 ? value : (fallback ?? '');
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const plainTextToEmailHtml = (text: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">${text
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`,
    )
    .join('')}</div>`;
