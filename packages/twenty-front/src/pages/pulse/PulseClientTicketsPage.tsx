import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { IconCheckbox } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import {
  useClientTickets,
  type TicketMailboxRule,
} from '@/pulse-tickets/hooks/useClientTickets';

const StyledPage = styled.div`
  padding: 28px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  color: ${themeCssVariables.font.color.primary};
  h1 {
    font-size: 24px;
    margin: 0 0 12px;
  }
  h2 {
    font-size: 17px;
    margin: 0 0 12px;
  }
  p {
    line-height: 1.6;
    color: ${themeCssVariables.font.color.secondary};
  }
  section {
    max-width: 900px;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 12px;
    padding: 24px;
    margin: 20px 0;
    background: ${themeCssVariables.background.primary};
  }
  input:not([type='checkbox']) {
    box-sizing: border-box;
    width: 100%;
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 8px;
    padding: 10px;
    margin: 8px 0 16px;
    background: ${themeCssVariables.background.secondary};
    color: inherit;
    font: inherit;
  }
  button,
  a {
    font: inherit;
  }
  button {
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 8px;
    background: ${themeCssVariables.background.secondary};
    color: inherit;
    padding: 10px 16px;
    cursor: pointer;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }
  a {
    color: ${themeCssVariables.accent.accent11};
  }
  button:focus-visible,
  input:focus-visible,
  a:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
  }
  label {
    display: block;
    line-height: 1.5;
  }
  [role='alert'] {
    color: ${themeCssVariables.font.color.danger};
  }
  @media (max-width: 640px) {
    padding: 16px;
    section {
      padding: 16px;
    }
  }
`;

const MailboxRule = ({
  mailbox,
  rule,
  save,
}: {
  mailbox: { id: string; handle: string; isSyncEnabled: boolean };
  rule?: TicketMailboxRule;
  save: (rule: TicketMailboxRule) => Promise<void>;
}) => {
  const { t } = useLingui();
  const [keywords, setKeywords] = useState(
    rule?.keywords.join(', ') ?? 'help, issue, request, fix',
  );
  const [enabled, setEnabled] = useState(rule?.enabled ?? false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <section>
      <h2>{mailbox.handle}</h2>
      <p>
        {mailbox.isSyncEnabled
          ? t`Mailbox sync is enabled.`
          : t`Enable mailbox sync in Accounts before automatic capture can run.`}
      </p>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />{' '}
        {t`Automatically create client tickets from this mailbox`}
      </label>
      <p>{t`Only new incoming emails from contacts linked to exactly one CRM client qualify. A subject must contain one of your keywords. Each conversation creates at most one ticket, assigned to you in New. The subject becomes a shared ticket title; email bodies and attachments are never copied.`}</p>
      <label>
        {t`Subject keywords, separated by commas`}
        <input
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
        />
      </label>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          setMessage('');
          try {
            await save({
              channelId: mailbox.id,
              enabled,
              keywords: keywords
                .split(',')
                .map((word) => word.trim())
                .filter(Boolean),
            });
            setMessage(
              t`Saved. Capture starts with new emails from now and runs every five minutes after mailbox sync.`,
            );
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : t`Could not save email capture.`,
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? t`Saving…` : t`Save email rule`}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
};

export const PulseClientTicketsPage = () => {
  const { t } = useLingui();
  const { settings, loading, error, setup, saveRule, refetch } =
    useClientTickets();
  const [busy, setBusy] = useState(false);
  const [setupError, setSetupError] = useState('');
  return (
    <PageCardLayout
      header={<PageHeader title={t`Client tickets`} Icon={IconCheckbox} />}
    >
      <StyledPage>
        <h1>{t`Client work, organized.`}</h1>
        <p>{t`Keep delivery work separate from sales and personal tasks. Track New → To do → In progress → Waiting on client → Done. Link the client, assign a teammate, set a priority and due date, and group related tickets by project.`}</p>
        {loading && <p role="status">{t`Loading client tickets…`}</p>}
        {error && (
          <p role="alert">
            {error.message}{' '}
            <button onClick={() => void refetch()}>{t`Retry`}</button>
          </p>
        )}
        {settings && (
          <section>
            <h2>{t`Your client board`}</h2>
            {settings.board ? (
              <>
                <p>{t`Drag tickets between stages. Use search, filters, and saved views to focus on an assignee, client, project, or priority. Open a ticket to edit its details.`}</p>
                <a href={settings.board.href}>{t`Open Client Tickets board`}</a>
              </>
            ) : (
              <>
                <p>{t`Enable this once for the workspace. A workspace administrator with data-model access is required.`}</p>
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setSetupError('');
                    try {
                      const board = await setup();
                      if (board) window.location.assign(board.href);
                    } catch (caught) {
                      setSetupError(
                        caught instanceof Error
                          ? caught.message
                          : t`Could not enable Client Tickets.`,
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? t`Setting up the board…` : t`Enable Client Tickets`}
                </button>
              </>
            )}
            {setupError && <p role="alert">{setupError}</p>}
          </section>
        )}
        <section>
          <h2>{t`Ask Claude or ChatGPT to manage client work`}</h2>
          <p>{t`After enabling the board, reconnect your BlackSync MCP connection to refresh its tools. Ask: “Create a client ticket for Acme to finish onboarding, assign it to Sarah, set priority High, and move it to To do.” Your usual record permissions apply.`}</p>
          <p>{t`AI-created tickets use the clientTicket object, with client, assignee, project, status, priority, and due date. They stay separate from opportunities and tasks.`}</p>
        </section>
        {settings?.board && (
          <>
            <h2>{t`Email → client tickets`}</h2>
            <p>{t`Each user can enable capture for their own connected mailboxes. Saving a rule starts from now; old emails are not imported as tickets. Tickets are shared according to the board’s record permissions.`}</p>
            {settings.mailboxes.length === 0 && (
              <p>{t`Connect your Google or Microsoft email under Settings → Accounts, then return here to enable capture.`}</p>
            )}
            {settings.mailboxes.map((mailbox) => (
              <MailboxRule
                key={mailbox.id}
                mailbox={mailbox}
                rule={settings.rules.find(
                  (rule) => rule.channelId === mailbox.id,
                )}
                save={saveRule}
              />
            ))}
          </>
        )}
      </StyledPage>
    </PageCardLayout>
  );
};
