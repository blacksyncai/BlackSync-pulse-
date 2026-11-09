import { type I18n } from '@lingui/core';
import { buildPulseWelcomeEmail } from '../utils/build-pulse-welcome-email.util';
const i18n = {
  _: (descriptor: { id: string; message?: string }) =>
    descriptor.message ?? descriptor.id,
} as unknown as I18n;
describe('welcome email content', () => {
  it('contains branded instructions and the CRM link in HTML and plain text', () => {
    const email = buildPulseWelcomeEmail({
      firstName: 'Alex',
      link: 'https://crm.blacksync.cloud/',
      i18n,
    });
    expect(email.subject).toBe('Welcome to BlackSync Cloud');
    expect(email.text).toContain('Hi Alex,');
    expect(email.text).toContain('https://crm.blacksync.cloud/');
    expect(email.html).toContain('BLACKSYNC CLOUD');
    expect(email.html).not.toContain('Twenty');
  });
  it('uses a natural greeting when signup has no name yet', () =>
    expect(
      buildPulseWelcomeEmail({
        firstName: ' ',
        link: 'https://crm.blacksync.cloud/',
        i18n,
      }).text,
    ).toContain('Welcome!'));
  it('escapes user names and link attributes', () => {
    const email = buildPulseWelcomeEmail({
      firstName: '<img src=x onerror="alert(1)">',
      link: 'https://crm.blacksync.cloud/?a="x"&b=1',
      i18n,
    });
    expect(email.html).not.toContain('<img src=x');
    expect(email.html).toContain('&lt;img');
    expect(email.html).toContain('a=&quot;x&quot;&amp;b=1');
  });
});
