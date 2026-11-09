import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconMessageCircle } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { useConversations } from '@/pulse-conversations/hooks/useConversations';
import {
  filterConversations,
  type Conversation,
} from '@/pulse-conversations/utils/buildConversation';
import { PulseCallCardBody } from '@/pulse-record/components/PulseCallCardBody';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';

const StyledPage = styled.div`
  padding: 24px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  color: ${themeCssVariables.font.color.primary};
  h1 {
    margin: 0;
    font-size: 26px;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.5;
  }
  button,
  input,
  select {
    font: inherit;
    color: inherit;
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 8px;
    background: ${themeCssVariables.background.primary};
    padding: 9px 12px;
  }
  button {
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  tr:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 2px;
  }
  [role='alert'] {
    color: ${themeCssVariables.font.color.danger};
  }
  @media (max-width: 760px) {
    padding: 16px;
  }
`;
const StyledFilters = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin: 20px 0 12px;
  input[type='search'] {
    flex: 1;
    min-width: min(260px, 100%);
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
`;
const StyledTableWrap = styled.div`
  overflow: auto;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 1000px;
    font-size: 13px;
  }
  th {
    text-align: left;
    background: ${themeCssVariables.background.secondary};
    font-size: 12px;
    color: ${themeCssVariables.font.color.secondary};
    font-weight: 600;
    padding: 14px 16px;
  }
  td {
    padding: 16px;
    border-top: 1px solid ${themeCssVariables.border.color.medium};
    vertical-align: middle;
    max-width: 240px;
    overflow-wrap: anywhere;
  }
  strong {
    display: block;
    font-size: 14px;
    margin-bottom: 5px;
  }
  small {
    display: block;
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.5;
  }
  tr:hover td {
    background: ${themeCssVariables.background.secondary};
  }
  audio {
    width: 230px;
    height: 34px;
    display: block;
    margin-bottom: 5px;
  }
  @media (max-width: 760px) {
    border: none;
    overflow: visible;
    table,
    tbody,
    tr,
    td {
      display: block;
      min-width: 0;
      width: auto;
      max-width: none;
    }
    thead {
      display: none;
    }
    tr {
      border: 1px solid ${themeCssVariables.border.color.medium};
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }
    td {
      border: 0;
      padding: 8px;
    }
    td::before {
      content: attr(data-label);
      display: block;
      font-size: 11px;
      color: ${themeCssVariables.font.color.secondary};
      margin-bottom: 5px;
    }
    audio {
      width: 100%;
    }
    td:last-child button {
      width: 100%;
    }
  }
`;
const StyledDialog = styled.dialog`
  width: min(1080px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 16px;
  overflow: auto;
  background: ${themeCssVariables.background.primary};
  color: ${themeCssVariables.font.color.primary};
  box-shadow: 0 24px 100px #0005;
  &::backdrop {
    background: #08091299;
    backdrop-filter: blur(4px);
  }
  header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${themeCssVariables.background.primary};
    border-bottom: 1px solid ${themeCssVariables.border.color.medium};
    padding: 20px 24px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    justify-content: space-between;
  }
  h2 {
    font-size: 22px;
    margin: 0 0 6px;
  }
  p {
    margin: 6px 0;
    line-height: 1.5;
    color: ${themeCssVariables.font.color.secondary};
    font-size: 13px;
  }
  button {
    font: inherit;
    border: 1px solid ${themeCssVariables.border.color.strong};
    padding: 8px 12px;
    border-radius: 8px;
    background: ${themeCssVariables.background.secondary};
    color: inherit;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 2px;
  }
`;
const StyledDetailBody = styled.div`
  padding: 24px;
  min-width: 0;
`;
const ConversationDetail = ({
  call,
  dismiss,
}: {
  call: Conversation;
  dismiss: () => void;
}) => {
  const { t } = useLingui();
  const dialog = useRef<HTMLDialogElement>(null);
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  useEffect(() => {
    const element = dialog.current;
    document.querySelectorAll('audio').forEach((audio) => audio.pause());
    element?.showModal();
    return () => element?.close();
  }, []);
  return createPortal(
    <StyledDialog
      ref={dialog}
      aria-labelledby="conversation-detail-title"
      onCancel={dismiss}
      onClose={dismiss}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <header>
        <div>
          <h2 id="conversation-detail-title">
            {call.contactName || call.phone || t`Call details`}
          </h2>
          <p>
            {[call.companyName, call.location].filter(Boolean).join(' · ') ||
              t`Location not recorded`}
          </p>
          <p>
            {call.date.toLocaleString()} ·{' '}
            {call.direction === 'inbound' ? t`Incoming` : t`Outgoing`}
            {call.duration ? ` · ${call.duration}` : ''}
            {call.outcome ? ` · ${call.outcome}` : ''}
          </p>
          {call.phone && <p>{call.phone}</p>}
          {call.personId && (
            <button
              onClick={() => {
                dismiss();
                openRecordInSidePanel({
                  recordId: call.personId ?? '',
                  objectNameSingular: 'person',
                });
              }}
            >{t`Open contact`}</button>
          )}
        </div>
        <button
          autoFocus
          onClick={dismiss}
          aria-label={t`Close conversation`}
        >{t`Close`}</button>
      </header>
      <StyledDetailBody>
        <PulseCallCardBody item={call} initialTranscriptOpen />
      </StyledDetailBody>
    </StyledDialog>,
    document.body,
  );
};
export const PulseConversationsPage = () => {
  const { t } = useLingui();
  const {
    conversations,
    notes,
    targets,
    attachments,
    loading,
    error,
    refresh,
  } = useConversations();
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('all');
  const [recordedOnly, setRecordedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const calls = filterConversations(
    conversations,
    deferredSearch,
    direction,
    recordedOnly,
  );
  const selected = conversations.find((call) => call.id === selectedId);
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setActionError('');
    try {
      await work();
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : t`Could not load conversations.`,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <PageCardLayout
      header={<PageHeader title={t`Conversations`} Icon={IconMessageCircle} />}
    >
      <StyledPage>
        <h1>{t`Every call, easy to find.`}</h1>
        <p>{t`See who was called, the client and location, and listen to available recordings. Double-click a row or choose Open for the transcript, summary, and full call details.`}</p>
        <StyledFilters>
          <input
            type="search"
            aria-label={t`Search loaded conversations`}
            placeholder={t`Search loaded calls: contact, number, company, transcript…`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label={t`Call direction`}
            value={direction}
            onChange={(event) => setDirection(event.target.value)}
          >
            <option value="all">{t`All calls`}</option>
            <option value="inbound">{t`Incoming`}</option>
            <option value="outbound">{t`Outgoing`}</option>
          </select>
          <label>
            <input
              type="checkbox"
              checked={recordedOnly}
              onChange={(event) => setRecordedOnly(event.target.checked)}
            />
            {t`With recording`}
          </label>
          <button
            disabled={busy || loading}
            onClick={() => void run(refresh)}
          >{t`Refresh`}</button>
        </StyledFilters>
        <p role="status">
          {loading
            ? t`Loading conversations…`
            : t`${calls.length} shown · ${conversations.length} calls loaded`}
          {notes.hasNextPage
            ? ` · ${t`Load older calls to search further back.`}`
            : ''}
        </p>
        {(error || actionError) && (
          <p role="alert">{actionError || error?.message}</p>
        )}
        {!loading && !error && conversations.length === 0 && (
          <p>{t`No call history yet. Calls logged in this workspace will appear here.`}</p>
        )}
        {!loading && conversations.length > 0 && calls.length === 0 && (
          <p>{t`No loaded calls match your filters. Clear the search or load older calls.`}</p>
        )}
        {calls.length > 0 && (
          <StyledTableWrap>
            <table>
              <thead>
                <tr>
                  <th>{t`Contact / number`}</th>
                  <th>{t`Client / location`}</th>
                  <th>{t`When`}</th>
                  <th>{t`Call details`}</th>
                  <th>{t`Recording`}</th>
                  <th>{t`View`}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr
                    key={call.id}
                    tabIndex={0}
                    aria-label={t`Call with ${call.title}`}
                    onDoubleClick={(event) => {
                      if (
                        !(event.target as HTMLElement).closest(
                          'audio, button, a, input',
                        )
                      )
                        setSelectedId(call.id);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.target === event.currentTarget &&
                        event.key === 'Enter'
                      )
                        setSelectedId(call.id);
                    }}
                  >
                    <td data-label={t`Contact / number`}>
                      <strong>
                        {call.contactName || call.phone || t`Unknown contact`}
                      </strong>
                      <small>
                        {call.contactName
                          ? call.phone || t`Number not recorded`
                          : call.title}
                      </small>
                    </td>
                    <td data-label={t`Client / location`}>
                      <strong>
                        {call.companyName || t`Client not linked`}
                      </strong>
                      <small>{call.location || t`Location not recorded`}</small>
                    </td>
                    <td data-label={t`When`}>
                      <strong>{call.date.toLocaleDateString()}</strong>
                      <small>
                        {call.date.toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </small>
                    </td>
                    <td data-label={t`Call details`}>
                      <strong>
                        {call.direction === 'inbound'
                          ? t`Incoming`
                          : t`Outgoing`}
                        {call.duration ? ` · ${call.duration}` : ''}
                      </strong>
                      <small>{call.outcome || t`Outcome not recorded`}</small>
                      <small>{call.repName || ''}</small>
                    </td>
                    <td data-label={t`Recording`}>
                      {call.recordingUrl ? (
                        <audio
                          controls
                          preload="none"
                          aria-label={t`Recording for ${call.title}`}
                          src={call.recordingUrl}
                          onPlay={(event) => {
                            const playing = event.currentTarget;
                            document
                              .querySelectorAll('audio')
                              .forEach((audio) => {
                                if (audio !== playing) audio.pause();
                              });
                          }}
                        />
                      ) : (
                        <small>{t`No recording available`}</small>
                      )}
                      <small>
                        {call.hasTranscript
                          ? t`Transcript available`
                          : t`Open for available call details`}
                      </small>
                    </td>
                    <td data-label={t`View`}>
                      <button
                        onClick={() => setSelectedId(call.id)}
                      >{t`Open`}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </StyledTableWrap>
        )}
        <StyledFilters>
          {notes.hasNextPage && (
            <button
              disabled={busy || loading}
              onClick={() => void run(notes.fetchMoreRecords)}
            >
              {busy ? t`Loading…` : t`Load older calls`}
            </button>
          )}
          {targets.hasNextPage && (
            <button
              disabled={busy || loading}
              onClick={() => void run(targets.fetchMoreRecords)}
            >{t`Load more contact details`}</button>
          )}
          {attachments.hasNextPage && (
            <button
              disabled={busy || loading}
              onClick={() => void run(attachments.fetchMoreRecords)}
            >{t`Load more recordings`}</button>
          )}
        </StyledFilters>
        {selected && (
          <ConversationDetail
            key={selected.id}
            call={selected}
            dismiss={() => setSelectedId(null)}
          />
        )}
      </StyledPage>
    </PageCardLayout>
  );
};
