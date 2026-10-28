import { isNonEmptyString } from '@sniptt/guards';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import {
  type AdditionalPhoneMetadata,
  type FullNameMetadata,
  type PhonesMetadata,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import {
  type CloseCallActivity,
  type CloseEmailActivity,
  type CloseLead,
  type CloseOpportunity,
  type CloseSmsActivity,
} from 'src/engine/core-modules/close-import/types/close-api.type';

export const splitFullName = (name: string | null): FullNameMetadata => {
  const parts = (name ?? '').trim().split(/\s+/).filter(isNonEmptyString);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
};

const toPhoneMetadata = (phone: string): AdditionalPhoneMetadata | null => {
  try {
    const parsed = parsePhoneNumberWithError(phone, 'US');

    return {
      number: parsed.nationalNumber,
      countryCode: parsed.country ?? 'US',
      callingCode: `+${parsed.countryCallingCode}`,
    };
  } catch {
    return null;
  }
};

export const mapClosePhones = (phones: { phone: string }[]): PhonesMetadata => {
  const [primary, ...additional] = phones
    .map(({ phone }) => toPhoneMetadata(phone))
    .filter(isDefined);

  return {
    primaryPhoneNumber: primary?.number ?? '',
    primaryPhoneCountryCode: primary?.countryCode ?? ('' as never),
    primaryPhoneCallingCode: primary?.callingCode ?? '',
    additionalPhones: additional.length > 0 ? additional : null,
  };
};

export const mapCloseEmails = (emails: { email: string }[]) => {
  const [primary, ...additional] = emails
    .map(({ email }) => email.trim().toLowerCase())
    .filter(isNonEmptyString);

  return {
    primaryEmail: primary ?? null,
    additionalEmails: additional.length > 0 ? additional : null,
  };
};

export const mapCloseLeadDomain = (url: string | null) => ({
  primaryLinkUrl: isNonEmptyString(url) ? url.trim() : null,
  primaryLinkLabel: '',
  secondaryLinks: null,
});

export const mapCloseLeadAddress = (lead: CloseLead) => {
  const address = lead.addresses?.[0];

  return {
    addressStreet1: address?.address_1 ?? '',
    addressStreet2: address?.address_2 ?? '',
    addressCity: address?.city ?? '',
    addressState: address?.state ?? '',
    addressPostcode: address?.zipcode ?? '',
    addressCountry: address?.country ?? '',
    addressLat: null,
    addressLng: null,
  };
};

// Close pipelines are free-form, so active deals are placed by their status label.
export const mapCloseOpportunityStage = (
  opportunity: Pick<CloseOpportunity, 'status_type' | 'status_label'>,
): string => {
  if (opportunity.status_type === 'won') {
    return 'CUSTOMER';
  }

  const label = (opportunity.status_label ?? '').toLowerCase();

  if (/propos|quote|contract|negotiat|offer|closing/.test(label)) {
    return 'PROPOSAL';
  }

  if (/meet|demo|appointment|showing|call scheduled/.test(label)) {
    return 'MEETING';
  }

  if (/qualif|screen|contacted|discovery|interested/.test(label)) {
    return 'SCREENING';
  }

  return 'NEW';
};

export const formatCallDuration = (seconds: number | null) => {
  if (!isDefined(seconds) || seconds <= 0) {
    return '0s';
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

const capitalize = (value: string | null) =>
  isNonEmptyString(value)
    ? value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ')
    : '';

const joinLines = (lines: (string | null | undefined | false)[]) =>
  lines.filter(isNonEmptyString).join('\n\n');

export const buildCallNote = (call: CloseCallActivity) => ({
  title: [
    `${capitalize(call.direction) || 'Call'} call`,
    formatCallDuration(call.duration),
    capitalize(call.disposition),
  ]
    .filter(isNonEmptyString)
    .join(' · '),
  markdown: joinLines([
    call.note,
    isNonEmptyString(call.phone) && `Phone: ${call.phone}`,
    isNonEmptyString(call.recording_url) &&
      `[Call recording](${call.recording_url})`,
    isNonEmptyString(call.voicemail_url) &&
      `[Voicemail](${call.voicemail_url})`,
    isNonEmptyString(call.user_name) && `Logged by ${call.user_name} in Close`,
  ]),
});

export const buildEmailNote = (email: CloseEmailActivity) => ({
  title: `${email.direction === 'incoming' ? 'Email received' : 'Email sent'}: ${email.subject || '(no subject)'}`,
  markdown: joinLines([
    isNonEmptyString(email.sender) && `From: ${email.sender}`,
    isNonEmptyString(email.to?.join(', ')) && `To: ${email.to?.join(', ')}`,
    email.body_text,
  ]),
});

export const buildSmsNote = (sms: CloseSmsActivity) => ({
  title: sms.direction === 'inbound' ? 'Text received' : 'Text sent',
  markdown: joinLines([
    sms.text,
    isNonEmptyString(sms.remote_phone) && `Phone: ${sms.remote_phone}`,
  ]),
});
