import { type I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildPulseWelcomeEmail = ({
  firstName,
  link,
  i18n,
}: {
  firstName: string;
  link: string;
  i18n: I18n;
}) => {
  const subject = i18n._(msg`Welcome to BlackSync Cloud`);
  const name = firstName.trim();
  const greeting = name ? i18n._(msg`Hi ${name},`) : i18n._(msg`Welcome!`);
  const introduction = i18n._(
    msg`Thanks for joining BlackSync Cloud. Your account is ready to get started.`,
  );
  const nextSteps = i18n._(
    msg`Open your dashboard to organize leads, manage your pipeline, and keep track of your next steps.`,
  );
  const button = i18n._(msg`Open BlackSync Cloud`);
  const closing = i18n._(msg`The BlackSync Cloud team`);
  return {
    subject,
    text: `${greeting}\n\n${introduction}\n\n${nextSteps}\n\n${button}: ${link}\n\n${closing}`,
    html: `<html><body style="margin:0;background:#f5f4fa;font-family:Arial,sans-serif;color:#23212e"><main style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;padding:32px"><p style="font-weight:700;color:#7252cc">BLACKSYNC CLOUD</p><h1 style="font-size:26px">${escapeHtml(subject)}</h1><p>${escapeHtml(greeting)}</p><p style="line-height:1.6">${escapeHtml(introduction)}</p><p style="line-height:1.6">${escapeHtml(nextSteps)}</p><p style="margin:28px 0"><a style="background:#7252cc;color:#fff;border-radius:8px;padding:12px 20px;text-decoration:none;display:inline-block" href="${escapeHtml(link)}">${escapeHtml(button)}</a></p><p>${escapeHtml(closing)}</p></main></body></html>`,
  };
};
