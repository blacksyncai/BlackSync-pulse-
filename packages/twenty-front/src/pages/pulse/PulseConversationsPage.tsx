import { parsePulseCallBody } from '@/pulse-record/utils/parsePulseCallBody';
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
  padding: 28px 32px;
  flex: 1;
  min-height: 0;
  overflow: auto;
  color: ${themeCssVariables.font.color.primary};
  h1 {
    margin: 8px 0 12px;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.055em;
    line-height: 1.15;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.6;
    font-size: 13px;
  }
  button,
  input,
  select {
    font: inherit;
    color: inherit;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 10px;
    background: var(--bs-panel, ${themeCssVariables.background.primary});
    padding: 10px 13px;
  }
  button {
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
  }
  button:disabled {
    opacity: 0.5;
    cursor: wait;
  }
  button:hover:not(:disabled) {
    border-color: ${themeCssVariables.accent.accent7};
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  tr:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
  }
  [role='alert'] {
    color: ${themeCssVariables.font.color.danger};
  }
  @media (max-width: 760px) {
    padding: 20px 16px;
  }
`;
const StyledFilters = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px;
  margin: 16px 0 12px;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 8px;
  background: ${themeCssVariables.background.secondary};
  input[type='search'] {
    flex: 1;
    min-width: min(260px, 100%);
    font-size: 12px;
    border-color: transparent;
    background: transparent;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 0 6px;
  }
`;
const StyledTableWrap = styled.div`
  overflow: auto;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: 18px;
  background: var(--bs-panel, ${themeCssVariables.background.primary});
  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 980px;
    font-size: 13px;
  }
  th {
    text-align: left;
    background: ${themeCssVariables.background.secondary};
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${themeCssVariables.font.color.secondary};
    font-weight: 600;
    padding: 16px 18px;
  }
  td {
    padding: 20px 18px;
    border-top: 1px solid ${themeCssVariables.border.color.light};
    vertical-align: middle;
    max-width: 240px;
    overflow-wrap: anywhere;
  }
  strong {
    display: block;
    font-size: 13px;
    font-weight: 650;
    margin-bottom: 6px;
    letter-spacing: -0.015em;
  }
  small {
    display: block;
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.6;
    font-size: 11px;
  }
  tr:hover td {
    background: ${themeCssVariables.accent.tertiary};
  }
  audio {
    width: 220px;
    height: 32px;
    display: block;
    margin-bottom: 7px;
    accent-color: ${themeCssVariables.accent.accent9};
  }
  td:last-child button {
    background: ${themeCssVariables.accent.quaternary};
    color: ${themeCssVariables.accent.accent11};
    border-color: transparent;
  }
  .bs-direction {
    display: inline-flex;
    border-radius: 6px;
    padding: 4px 7px;
    margin-bottom: 5px;
    font-size: 10px;
    font-weight: 650;
    background: ${themeCssVariables.accent.quaternary};
    color: ${themeCssVariables.accent.accent11};
  }
  @media (max-width: 760px) {
    border: none;
    background: transparent;
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
      background: var(--bs-panel, ${themeCssVariables.background.primary});
      border: 1px solid ${themeCssVariables.border.color.light};
      border-radius: 18px;
      padding: 12px;
      margin-bottom: 14px;
    }
    td {
      border: 0;
      padding: 8px;
    }
    td::before {
      content: attr(data-label);
      display: block;
      font-size: 10px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: ${themeCssVariables.font.color.tertiary};
      margin-bottom: 7px;
    }
    audio {
      width: 100%;
    }
    td:last-child button {
      width: 100%;
    }
  }
`;
const StyledContact = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  > span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 12px;
    color: ${themeCssVariables.accent.accent11};
    background: ${themeCssVariables.accent.quaternary};
    font-size: 13px;
    font-weight: 700;
  }
  > div {
    min-width: 0;
  }
`;
const StyledHistory = styled.div`
  max-width: 1180px;
  margin: 24px auto 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;
const StyledCallEntry = styled.article`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 10px;
  background: ${themeCssVariables.background.primary};
  overflow: hidden;
  box-shadow: 0 1px 2px #00000005;
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
  }
  > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
    padding: 18px 20px;
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
  }
  strong {
    font-size: 15px;
    font-weight: 650;
  }
  .call-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    color: ${themeCssVariables.font.color.secondary};
    font-size: 12px;
    margin-top: 8px;
  }
  time {
    font-size: 12px;
    color: ${themeCssVariables.font.color.secondary};
  }
  .call-context {
    padding: 14px 20px;
    font-size: 13px;
    line-height: 1.65;
    color: ${themeCssVariables.font.color.secondary};
  }
  .call-player {
    border-top: 1px solid ${themeCssVariables.border.color.light};
    padding: 12px 20px;
  }
  audio {
    display: block;
    width: 100%;
    height: 42px;
  }
  footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 20px;
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }
  footer > span {
    flex: 1;
    font-size: 12px;
    color: ${themeCssVariables.font.color.secondary};
  }
  @media (max-width: 600px) {
    > header,
    .call-context,
    .call-player,
    footer {
      padding-left: 14px;
      padding-right: 14px;
    }
  }
`;

const StyledDialog = styled.dialog`
  width: min(1080px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid var(--bs-edge, ${themeCssVariables.border.color.medium});
  border-radius: 24px;
  overflow: auto;
  background: var(--bs-panel, ${themeCssVariables.background.primary});
  color: ${themeCssVariables.font.color.primary};
  box-shadow: 0 32px 100px #30251c30;
  &::backdrop {
    background: #27231e80;
    backdrop-filter: blur(7px);
  }
  header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${themeCssVariables.background.primary};
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    padding: 26px 28px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    justify-content: space-between;
  }
  h2 {
    font-size: 24px;
    letter-spacing: -0.04em;
    margin: 0 0 8px;
  }
  p {
    margin: 6px 0;
    line-height: 1.5;
    color: ${themeCssVariables.font.color.secondary};
    font-size: 12px;
  }
  button {
    font: inherit;
    font-size: 12px;
    border: 1px solid ${themeCssVariables.border.color.medium};
    padding: 9px 13px;
    border-radius: 10px;
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
  padding: 28px;
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
    document
      .querySelectorAll<HTMLAudioElement>('audio[data-conversation-recording]')
      .forEach((audio) => audio.pause());
    element?.showModal();
    return () => {
      element?.querySelectorAll('audio').forEach((audio) => audio.pause());
      element?.close();
    };
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
  const [view, setView] = useState<'history' | 'table'>('history');
  const [match, setMatch] = useState<'all' | 'any'>('all');
  const [rep, setRep] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const calls = filterConversations(
    conversations,
    deferredSearch,
    direction,
    recordedOnly,
    { match, rep, from, to },
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
        <h1>{t`History`}</h1>
        <p>{t`Listen to calls, review context, and open a conversation for its transcript and full details.`}</p>
        <StyledFilters>
          <input
            type="search"
            aria-label={t`Search loaded conversations`}
            placeholder={t`Search loaded calls: contact, number, company, transcript…`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label={t`Search matching`}
            value={match}
            onChange={(event) => setMatch(event.target.value as 'all' | 'any')}
          >
            <option value="all">{t`Match all words`}</option>
            <option value="any">{t`Match any word`}</option>
          </select>
          <select
            aria-label={t`Logged by`}
            value={rep}
            onChange={(event) => setRep(event.target.value)}
          >
            <option value="">{t`Everyone`}</option>
            {[
              ...new Set(
                conversations
                  .map((call) => call.repName)
                  .filter((name): name is string => Boolean(name)),
              ),
            ]
              .sort()
              .map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
          </select>
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
        <StyledFilters>
          <label>
            {t`From`}
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label>
            {t`Through`}
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          <select
            aria-label={t`Conversation layout`}
            value={view}
            onChange={(event) =>
              setView(event.target.value as 'history' | 'table')
            }
          >
            <option value="history">{t`History feed`}</option>
            <option value="table">{t`Table`}</option>
          </select>
          {(search ||
            rep ||
            from ||
            to ||
            recordedOnly ||
            direction !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRep('');
                setFrom('');
                setTo('');
                setRecordedOnly(false);
                setDirection('all');
              }}
            >{t`Clear filters`}</button>
          )}
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
        {calls.length > 0 && view === 'history' && (
          <StyledHistory aria-label={t`Call history`}>
            {calls.map((call) => {
              const parsed = parsePulseCallBody(call.body);
              const summary = parsed.aiSummary.join(' ') || parsed.summary;
              return (
                <StyledCallEntry
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
                  <header>
                    <div>
                      <strong>
                        {call.direction === 'inbound'
                          ? t`Incoming call`
                          : t`Called`}{' '}
                        {call.contactName || call.phone || call.title}
                      </strong>
                      <div className="call-meta">
                        <span>{call.companyName || t`Client not linked`}</span>
                        {call.phone && <span>{call.phone}</span>}
                        {call.duration && <span>{call.duration}</span>}
                        {call.repName && <span>{call.repName}</span>}
                      </div>
                    </div>
                    <time dateTime={call.date.toISOString()}>
                      {call.date.toLocaleString()}
                    </time>
                  </header>
                  <div className="call-context">
                    {call.outcome && <strong>{call.outcome} · </strong>}
                    {summary
                      ? summary.slice(0, 300) +
                        (summary.length > 300 ? '…' : '')
                      : t`Open the conversation to review its available notes and details.`}
                    {call.location && <div>{call.location}</div>}
                  </div>
                  <div className="call-player">
                    {call.recordingUrl ? (
                      <audio
                        controls
                        data-conversation-recording="true"
                        preload="none"
                        aria-label={t`Recording for ${call.title}`}
                        src={call.recordingUrl}
                        onPlay={(event) => {
                          const playing = event.currentTarget;
                          document
                            .querySelectorAll<HTMLAudioElement>(
                              'audio[data-conversation-recording]',
                            )
                            .forEach((audio) => {
                              if (audio !== playing) audio.pause();
                            });
                        }}
                      />
                    ) : (
                      <span>{t`No recording available`}</span>
                    )}
                  </div>
                  <footer>
                    <span>
                      {call.hasTranscript
                        ? t`Transcript available`
                        : t`Transcript not available`}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        openRecordInSidePanel({
                          objectNameSingular: 'note',
                          recordId: call.id,
                        })
                      }
                    >{t`Open call record`}</button>
                    <button
                      type="button"
                      onClick={() => setSelectedId(call.id)}
                    >{t`Open`}</button>
                  </footer>
                </StyledCallEntry>
              );
            })}
          </StyledHistory>
        )}
        {calls.length > 0 && view === 'table' && (
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
                      <StyledContact>
                        <span aria-hidden="true">
                          {call.contactName?.trim().charAt(0).toUpperCase() ||
                            '#'}
                        </span>
                        <div>
                          <strong>
                            {call.contactName ||
                              call.phone ||
                              t`Unknown contact`}
                          </strong>
                          <small>
                            {call.contactName
                              ? call.phone || t`Number not recorded`
                              : call.title}
                          </small>
                        </div>
                      </StyledContact>
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
                          data-conversation-recording="true"
                          preload="none"
                          aria-label={t`Recording for ${call.title}`}
                          src={call.recordingUrl}
                          onPlay={(event) => {
                            const playing = event.currentTarget;
                            document
                              .querySelectorAll<HTMLAudioElement>(
                                'audio[data-conversation-recording]',
                              )
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
