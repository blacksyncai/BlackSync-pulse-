import { randomUUID } from 'crypto';
import {
  escapePulseFormHtml as escape,
  type PulseFormDefinition,
} from './pulse-form-definition';

export const renderPulseFormPage = (
  form: PulseFormDefinition,
  options: {
    action?: string;
    success?: boolean;
    error?: string;
    answers?: Record<string, string>;
  } = {},
) => {
  const fields = form.fields
    .map((field) => {
      const label = escape(field.label),
        key = field.key;
      const attributes = `id="${key}" name="${key}" ${field.required ? 'required' : ''} maxlength="${key === 'message' ? 5000 : 250}"`;
      const value = escape(options.answers?.[key] ?? '');
      const input =
        key === 'message'
          ? `<textarea ${attributes} rows="5">${value}</textarea>`
          : `<input ${attributes} type="${key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}" value="${value}" ${key === 'phone' ? 'placeholder="+14155550123"' : ''}>`;
      return `<label for="${key}">${label}${field.required ? ' <span aria-hidden="true">*</span>' : ''}${input}</label>`;
    })
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escape(form.title)} · BlackSync</title><style>
  *{box-sizing:border-box}body{margin:0;padding:32px 16px;background:#101014;color:#f5f3ff;font:16px system-ui,sans-serif}main{max-width:560px;margin:32px auto;background:#19191f;border:1px solid #33313e;border-radius:20px;padding:28px}small{color:#bca7ff}h1{font-size:28px;overflow-wrap:anywhere}p{line-height:1.6;color:#bcb9c9;white-space:pre-wrap}label{display:block;margin-top:20px}input,textarea{display:block;width:100%;background:#101014;border:1px solid #494454;border-radius:8px;color:inherit;font:inherit;padding:12px;margin-top:8px}input:focus,textarea:focus{outline:2px solid #a68bff;outline-offset:2px}button{background:#8060e8;border:0;border-radius:8px;color:white;font:inherit;padding:14px 20px;width:100%;margin-top:24px;cursor:pointer}.trap{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}.error{color:#ffabb8}a{color:#bca7ff}
  </style></head><body><main><small>BLACKSYNC CLOUD</small><h1>${escape(form.title)}</h1>${options.success ? `<p role="status">${escape(form.successMessage)}</p>` : `<p>${escape(form.description)}</p>${options.error ? `<p class="error" role="alert">${escape(options.error)}</p>` : ''}<form method="post" action="${escape(options.action ?? '')}"><input type="hidden" name="submissionId" value="${randomUUID()}"><div class="trap" aria-hidden="true"><label>Leave empty<input name="websiteConfirmation" tabindex="-1" autocomplete="off"></label></div>${fields}<button type="submit">${escape(form.submitLabel)}</button></form>`}</main></body></html>`;
};
