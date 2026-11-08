# Google email connection for BlackSync Cloud

Users connect through Settings → Accounts → Connect with Google. They never need IMAP or SMTP settings. BlackSync must first register its own Google OAuth application.

## Google Cloud owner setup

1. Open the Google Cloud project owned by BlackSync. Enable Gmail API. Enable Calendar API if calendar access is offered. Configure the Google Auth Platform consent screen with BlackSync's name, support address and owned domains.
2. Create an OAuth client of type **Web application**. Register this exact authorized redirect URI:
   `https://crm.blacksync.cloud/auth/google-apis/get-access-token`
3. For a test rollout, add the intended Google accounts as test users. Google currently treats Gmail access scopes as restricted; an external public release may require Google's verification. Testing-mode authorizations can expire after seven days. Verify the applicable requirements in the project's Google console before offering the integration publicly.
4. Add `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET` to this repository's **Settings → Secrets and variables → Actions**. Never put the client secret in source, a ticket or chat.
5. Rerun **Google email configuration check** in GitHub Actions. It uses the existing `RAILWAY_TOKEN` secret to save the Google settings and enable Gmail on the CRM server and worker, then request deployments of their configured images. It logs presence checks only. It does not change the separate Google sign-in feature or disable database configuration globally.

## Verify

After both deployments are healthy, GET `https://crm.blacksync.cloud/client-config` and check `isGoogleMessagingEnabled` is true. Reload Accounts, choose Connect with Google, select the intended account, and approve access. Verify initial inbox sync and a test send.

Database-stored configuration takes precedence over environment variables. If public configuration remains false after the Railway update, use the instance admin configuration to enable `MESSAGING_PROVIDER_GMAIL_ENABLED` and ensure the three Google OAuth settings match the same OAuth client. Do not disable all database-backed settings to override one integration.

The setup job cannot create or verify the Google Cloud OAuth application. Client registration and approved consent must exist before the connection works. A successful configuration-check job with a missing-credentials notice does not mean Google email was enabled.

The November 8 readiness check confirmed that neither Railway service had Google OAuth credentials or the callback configured in its environment, and Gmail was disabled there. No customer Google account has been connected by this setup job.
