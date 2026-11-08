import {
  parsePulseFormAnswers,
  parsePulseFormDefinition,
  type PulseFormDefinition,
} from '../utils/pulse-form-definition';
import { renderPulseFormPage } from '../utils/render-pulse-form';

export const definition: PulseFormDefinition = {
  title: 'Website inquiries',
  description: 'Tell us more',
  submitLabel: 'Send',
  successMessage: 'Thank you',
  published: true,
  fields: [
    { key: 'firstName', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'message', label: 'Message', required: false },
  ],
  pondValue: null,
  pipelineViewId: null,
  stageValue: null,
};

describe('form definition and submission boundaries', () => {
  it('accepts a contact form and strips unknown routing and storage keys', () => {
    expect(
      parsePulseFormDefinition({
        ...definition,
        workspaceId: 'attacker',
        userId: 'attacker',
      }),
    ).toEqual(definition);
    expect(
      parsePulseFormAnswers(definition, {
        firstName: ' Ann ',
        email: 'ann@example.com',
        message: 'Hello',
        stage: 'WON',
        accountOwnerId: 'attacker',
      }),
    ).toEqual({ firstName: 'Ann', email: 'ann@example.com', message: 'Hello' });
  });
  it.each([
    { ...definition, fields: [] },
    { ...definition, fields: [definition.fields[0]] },
    { ...definition, fields: [definition.fields[1], definition.fields[1]] },
    {
      ...definition,
      fields: [{ key: 'accountOwnerId', label: 'Owner', required: true }],
    },
    { ...definition, title: 'x'.repeat(121) },
    {
      ...definition,
      pipelineViewId: '00000000-0000-4000-8000-000000000001',
      stageValue: null,
    },
  ])('rejects invalid definitions', (input) =>
    expect(() => parsePulseFormDefinition(input)).toThrow(),
  );
  it.each([
    { firstName: '', email: 'ann@example.com' },
    { firstName: 'Ann', email: 'wrong' },
    { firstName: 'Ann', email: ['ann@example.com'] },
    { firstName: 'Ann', email: 'ann@example.com', message: 'x'.repeat(5001) },
  ])('rejects missing, oversized and incorrectly typed answers', (input) =>
    expect(() => parsePulseFormAnswers(definition, input)).toThrow(),
  );
  it('requires international phone numbers when a phone is provided', () => {
    const form = {
      ...definition,
      fields: [{ key: 'phone' as const, label: 'Phone', required: true }],
    };
    expect(() =>
      parsePulseFormAnswers(form, { phone: '4155550123' }),
    ).toThrow();
    expect(
      parsePulseFormAnswers(form, { phone: '+1 (415) 555-0123' }).phone,
    ).toBe('+1 (415) 555-0123');
  });
  it('escapes administrator and visitor text in hosted HTML', () => {
    const html = renderPulseFormPage(
      { ...definition, title: '<script>alert(1)</script>' },
      {
        answers: {
          firstName: '"><script>bad()</script>',
          message: '</textarea><script>bad()</script>',
        },
      },
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('name="submissionId"');
    expect(html).toContain('name="websiteConfirmation"');
    expect(html).not.toContain('accountOwnerId');
  });
  it('success pages do not expose contact IDs or form routing', () => {
    const html = renderPulseFormPage(
      { ...definition, pondValue: 'PRIVATE_POND' },
      { success: true },
    );
    expect(html).toContain('Thank you');
    expect(html).not.toContain('PRIVATE_POND');
    expect(html).not.toContain('<form');
  });
});
