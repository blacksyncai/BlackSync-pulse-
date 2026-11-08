import { BadRequestException } from '@nestjs/common';
import { isPlainObject } from 'twenty-shared/utils';

export const FORM_FIELD_KEYS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'company',
  'message',
] as const;
export type PulseFormFieldKey = (typeof FORM_FIELD_KEYS)[number];
export type PulseFormField = {
  key: PulseFormFieldKey;
  label: string;
  required: boolean;
};
export type PulseFormDefinition = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  published: boolean;
  fields: PulseFormField[];
  pondValue: string | null;
  pipelineViewId: string | null;
  stageValue: string | null;
};
export type StoredPulseForm = PulseFormDefinition & {
  id: string;
  userWorkspaceId: string;
  revision: number;
};

const text = (value: unknown, maximum: number, required = false) => {
  if (
    typeof value !== 'string' ||
    value.length > maximum ||
    (required && !value.trim())
  )
    throw new BadRequestException('Invalid form text.');
  return value.trim();
};
export const parsePulseFormDefinition = (
  value: unknown,
): PulseFormDefinition => {
  if (!isPlainObject(value)) throw new BadRequestException('Invalid form.');
  if (
    !Array.isArray(value.fields) ||
    value.fields.length < 1 ||
    value.fields.length > FORM_FIELD_KEYS.length
  )
    throw new BadRequestException('Choose form fields.');
  const seen = new Set<string>();
  const fields = value.fields.map((field: unknown): PulseFormField => {
    if (
      !isPlainObject(field) ||
      !(FORM_FIELD_KEYS as readonly unknown[]).includes(field.key) ||
      seen.has(String(field.key)) ||
      typeof field.required !== 'boolean'
    )
      throw new BadRequestException('Invalid or duplicate form field.');
    const key = field.key as PulseFormFieldKey;
    seen.add(key);
    return {
      key,
      label: text(field.label, 100, true),
      required: field.required,
    };
  });
  if (
    !fields.some(
      (field) => ['email', 'phone'].includes(field.key) && field.required,
    )
  )
    throw new BadRequestException('Require an email address or phone number.');
  const pipelineViewId =
    value.pipelineViewId === null ? null : text(value.pipelineViewId, 36, true);
  const stageValue =
    value.stageValue === null ? null : text(value.stageValue, 120, true);
  if (Boolean(pipelineViewId) !== Boolean(stageValue))
    throw new BadRequestException('Choose a pipeline and stage together.');
  if (pipelineViewId && !/^[0-9a-f-]{36}$/i.test(pipelineViewId))
    throw new BadRequestException('Invalid pipeline.');
  if (typeof value.published !== 'boolean')
    throw new BadRequestException('Invalid publish state.');
  return {
    title: text(value.title, 120, true),
    description: text(value.description, 1000),
    submitLabel: text(value.submitLabel, 60, true),
    successMessage: text(value.successMessage, 1000, true),
    published: value.published,
    fields,
    pipelineViewId,
    stageValue,
    pondValue:
      value.pondValue === null ? null : text(value.pondValue, 120, true),
  };
};

export const parsePulseFormAnswers = (
  form: PulseFormDefinition,
  value: unknown,
) => {
  if (!isPlainObject(value))
    throw new BadRequestException('Invalid submission.');
  const answers: Partial<Record<PulseFormFieldKey, string>> = {};
  for (const field of form.fields) {
    const raw = value[field.key] ?? '';
    answers[field.key] = text(
      raw,
      field.key === 'message' ? 5000 : 250,
      field.required,
    );
  }
  if (answers.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email))
    throw new BadRequestException('Enter a valid email address.');
  if (
    answers.phone &&
    !/^\+[1-9]\d{6,14}$/.test(answers.phone.replace(/[\s()-]/g, ''))
  )
    throw new BadRequestException(
      'Enter a phone number with its country code, such as +14155550123.',
    );
  return answers;
};

export const escapePulseFormHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ] ?? character,
  );
