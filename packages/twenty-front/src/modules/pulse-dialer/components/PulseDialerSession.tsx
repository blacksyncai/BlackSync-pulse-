import { PULSE_DIALER_DISPOSITIONS } from '@/pulse-dialer/constants/PulseDialerDispositions';
import { PulseDialerOutcomePanel } from '@/pulse-dialer/components/PulseDialerOutcome';
import { PulseDialerTimer } from '@/pulse-dialer/components/PulseDialerTimer';
import {
  type PulseDialerOutcome,
  usePulseDialer,
} from '@/pulse-dialer/hooks/usePulseDialer';
import {
  formatTalkTime,
  getPulseDialerStats,
} from '@/pulse-dialer/utils/getPulseDialerStats';
import { PulseLeadLogo } from '@/pulse-leads/components/PulseLeadLogo';
import { useLeadStatusOptions } from '@/pulse-leads/hooks/useLeadStatusOptions';
import { PulseTimelineCard } from '@/pulse-record/components/PulseTimelineCard';
import { usePulseAccountData } from '@/pulse-record/hooks/usePulseAccountData';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPhone,
  IconPhoneOff,
  IconChevronsRight,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { usePulseCalling } from '@/pulse-calling/hooks/usePulseCalling';

const AUTO_DIAL_DELAY_SECONDS = 3;

const StyledLayout = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 280px minmax(0, 1fr) 360px;
  height: 100%;
  min-height: 0;
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[5]};
  box-sizing: border-box;
`;

const StyledColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 0;
`;

const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 0;
  padding: ${themeCssVariables.spacing[4]};

  h3 {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: ${themeCssVariables.font.weight.semiBold};
    letter-spacing: 0.05em;
    margin: 0;
    text-transform: uppercase;
  }
`;

const StyledStats = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 1fr 1fr;

  div {
    background: ${themeCssVariables.background.secondary};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.tertiary};
    display: flex;
    flex-direction: column;
    font-size: ${themeCssVariables.font.size.sm};
    padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  }

  strong {
    color: ${themeCssVariables.font.color.primary};
    font-size: 20px;
  }
`;

const StyledQueue = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const StyledQueueItem = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: 8px 10px;
  text-align: left;

  span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    border-radius: 999px;
    flex: none;
    font-size: ${themeCssVariables.font.size.xs};
    padding: 1px 8px;
  }

  &[data-state='done'] {
    color: ${themeCssVariables.font.color.tertiary};
  }

  &[aria-current='true'] {
    background: ${themeCssVariables.accent.quaternary};
    font-weight: ${themeCssVariables.font.weight.semiBold};
  }
`;

const StyledLeadHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};

  h2 {
    color: ${themeCssVariables.font.color.primary};
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  p {
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.lg};
    margin: 2px 0 0;
  }

  button {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.accent.accent10};
    cursor: pointer;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.sm};
    margin-left: auto;
  }
`;

const StyledFacts = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[4]};

  strong {
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledControls = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledCallButton = styled.button`
  align-items: center;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  height: 52px;
  padding: 0 ${themeCssVariables.spacing[6]};

  &[data-tone='call'] {
    background: #30a46c;
  }

  &[data-tone='hangup'] {
    background: #e5484d;
  }
`;

const StyledRoundButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 999px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: 6px;
  height: 44px;
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledCallStatus = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.lg};
  font-variant-numeric: tabular-nums;

  strong {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow-y: auto;
`;

const StyledTopBar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;

  label {
    align-items: center;
    color: ${themeCssVariables.font.color.secondary};
    display: flex;
    font-size: ${themeCssVariables.font.size.md};
    gap: 6px;
  }

  button {
    background: transparent;
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.danger};
    cursor: pointer;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 32px;
    padding: 0 ${themeCssVariables.spacing[3]};
  }
`;

const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

const DISPOSITION_BY_ID = new Map(
  PULSE_DIALER_DISPOSITIONS.map((disposition) => [disposition.id, disposition]),
);

export const PulseDialerSession = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const {
    session,
    call,
    current,
    isCallActive,
    isAwaitingOutcome,
    dial,
    skip,
    jumpTo,
    saveOutcome,
    setAutoDial,
    hangUp,
    end,
  } = usePulseDialer();
  const { toggleMute } = usePulseCalling();
  const { options: statusOptions } = useLeadStatusOptions();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { account, timeline, deals } = usePulseAccountData(
    current?.companyId ?? '',
  );
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stats = getPulseDialerStats(session);
  const isFinished = !isDefined(current);

  const cancelCountdown = () => {
    if (countdownTimer.current !== null) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }

    setCountdown(null);
  };

  const dialSafely = async (lead = current) => {
    try {
      await dial(lead);
    } catch (error) {
      enqueueToast({
        variant: 'error',
        children:
          error instanceof Error && error.message.length > 0
            ? t`Could not start the call: ${error.message}`
            : t`Could not start the call. Check your microphone and phone settings.`,
      });
    }
  };

  const scheduleNextDial = () => {
    cancelCountdown();

    let remaining = AUTO_DIAL_DELAY_SECONDS;

    setCountdown(remaining);
    countdownTimer.current = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        cancelCountdown();
        void dialSafely();

        return;
      }

      setCountdown(remaining);
    }, 1000);
  };

  const handleSave = async (outcome: PulseDialerOutcome) => {
    const next = await saveOutcome(outcome);

    if (isDefined(next) && session.isAutoDial) {
      scheduleNextDial();
    }
  };

  const handleSkip = () => {
    cancelCountdown();
    skip();
  };

  const totalDeals = deals.reduce((sum, deal) => sum + deal.amount, 0);
  const callStatusLabel: Record<string, string> = {
    connecting: t`Connecting...`,
    ringing: t`Ringing...`,
    'in-call': t`On call`,
    ended: t`Call ended`,
    failed: call.errorMessage ?? t`Call failed`,
  };

  return (
    <StyledLayout>
      <StyledColumn>
        <StyledPanel>
          <StyledTopBar>
            <StyledMuted>{session.sourceLabel}</StyledMuted>
            <button
              type="button"
              onClick={() => {
                cancelCountdown();
                end();
              }}
            >
              {t`End session`}
            </button>
          </StyledTopBar>
          <StyledStats>
            <div>
              {t`Dialed`}
              <strong>{stats.dialed}</strong>
            </div>
            <div>
              {t`Connected`}
              <strong>
                {stats.connected}{' '}
                <small style={{ fontSize: 12 }}>{stats.connectRate}%</small>
              </strong>
            </div>
            <div>
              {t`Talk time`}
              <strong>{formatTalkTime(stats.talkSeconds)}</strong>
            </div>
            <div>
              {t`Left`}
              <strong>{stats.remaining}</strong>
            </div>
          </StyledStats>
          <StyledTopBar>
            <label>
              <input
                type="checkbox"
                checked={session.isAutoDial}
                onChange={(event) => {
                  if (!event.target.checked) {
                    cancelCountdown();
                  }

                  setAutoDial(event.target.checked);
                }}
              />
              {t`Auto-dial next`}
            </label>
          </StyledTopBar>
        </StyledPanel>
        <StyledPanel style={{ flex: 1 }}>
          <h3>{t`Queue`}</h3>
          <StyledQueue>
            {session.queue.map((lead, index) => {
              const result = session.results[lead.companyId];
              const disposition =
                result?.disposition === 'skipped'
                  ? null
                  : DISPOSITION_BY_ID.get(result?.disposition ?? 'connected');

              return (
                <StyledQueueItem
                  key={`${lead.companyId}-${index}`}
                  type="button"
                  aria-current={index === session.index}
                  data-state={isDefined(result) ? 'done' : 'todo'}
                  disabled={isCallActive}
                  onClick={() => {
                    cancelCountdown();
                    jumpTo(index);
                  }}
                >
                  <span>{lead.leadName || lead.contactName}</span>
                  {isDefined(result) && (
                    <small
                      style={{
                        background:
                          themeCssVariables.tag.background[
                            (disposition?.color ??
                              'gray') as keyof typeof themeCssVariables.tag.background
                          ],
                        color:
                          themeCssVariables.tag.text[
                            (disposition?.color ??
                              'gray') as keyof typeof themeCssVariables.tag.text
                          ],
                      }}
                    >
                      {disposition?.label ?? t`Skipped`}
                    </small>
                  )}
                </StyledQueueItem>
              );
            })}
          </StyledQueue>
        </StyledPanel>
      </StyledColumn>

      <StyledColumn>
        {isFinished ? (
          <StyledPanel>
            <h2 style={{ margin: 0 }}>{t`Session complete`}</h2>
            <StyledMuted>
              {t`${stats.dialed} dials, ${stats.connected} connects, ${formatTalkTime(stats.talkSeconds)} on the phone.`}
            </StyledMuted>
            <StyledControls>
              <StyledRoundButton type="button" onClick={end}>
                {t`Start a new session`}
              </StyledRoundButton>
            </StyledControls>
          </StyledPanel>
        ) : (
          <>
            <StyledPanel>
              <StyledLeadHeader>
                <PulseLeadLogo
                  name={current.leadName}
                  domain={account?.domainName?.primaryLinkUrl ?? null}
                />
                <div>
                  <h2>{current.contactName || current.leadName}</h2>
                  <p>
                    {current.leadName} · {current.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openRecordInSidePanel({
                      recordId: current.companyId,
                      objectNameSingular: CoreObjectNameSingular.Company,
                    })
                  }
                >
                  {t`Open lead`}
                </button>
              </StyledLeadHeader>
              <StyledFacts>
                <span>
                  {t`Status`}{' '}
                  <strong>
                    {statusOptions.find(
                      (option) => option.value === account?.leadStatus,
                    )?.label ?? t`None`}
                  </strong>
                </span>
                <span>
                  {t`Deals`}{' '}
                  <strong>
                    {deals.length === 0
                      ? t`None`
                      : totalDeals > 0
                        ? `$${Math.round(totalDeals).toLocaleString('en-US')}`
                        : String(deals.length)}
                  </strong>
                </span>
                <span>
                  {t`Lead ${session.index + 1} of ${session.queue.length}`}
                </span>
              </StyledFacts>
              <StyledControls>
                {isCallActive ? (
                  <>
                    <StyledCallButton
                      type="button"
                      data-tone="hangup"
                      onClick={() => void hangUp()}
                    >
                      <IconPhoneOff size={20} />
                      {t`Hang up`}
                    </StyledCallButton>
                    <StyledRoundButton
                      type="button"
                      onClick={() => void toggleMute()}
                    >
                      {call.isMuted ? (
                        <IconMicrophoneOff size={18} />
                      ) : (
                        <IconMicrophone size={18} />
                      )}
                      {call.isMuted ? t`Unmute` : t`Mute`}
                    </StyledRoundButton>
                  </>
                ) : (
                  !isAwaitingOutcome && (
                    <StyledCallButton
                      type="button"
                      data-tone="call"
                      onClick={() => {
                        cancelCountdown();
                        void dialSafely();
                      }}
                    >
                      <IconPhone size={20} />
                      {countdown !== null
                        ? t`Calling in ${countdown}...`
                        : t`Call ${current.contactName.split(' ')[0] || ''}`}
                    </StyledCallButton>
                  )
                )}
                <StyledRoundButton type="button" onClick={handleSkip}>
                  <IconChevronsRight size={18} />
                  {t`Skip`}
                </StyledRoundButton>
                {countdown !== null && (
                  <StyledRoundButton type="button" onClick={cancelCountdown}>
                    {t`Pause`}
                  </StyledRoundButton>
                )}
                {call.status !== 'idle' &&
                  call.companyId === current.companyId && (
                    <StyledCallStatus>
                      {callStatusLabel[call.status]}{' '}
                      {call.status === 'in-call' &&
                        isDefined(call.answeredAt) && (
                          <strong>
                            <PulseDialerTimer since={call.answeredAt} />
                          </strong>
                        )}
                    </StyledCallStatus>
                  )}
              </StyledControls>
            </StyledPanel>

            {isAwaitingOutcome && (
              <StyledPanel>
                <h3>{t`How did it go?`}</h3>
                <PulseDialerOutcomePanel
                  key={`${current.companyId}-${call.endedAt ?? 0}`}
                  wasAnswered={isDefined(call.answeredAt)}
                  statusOptions={statusOptions}
                  currentStatus={account?.leadStatus ?? null}
                  hasNext={session.index + 1 < session.queue.length}
                  isAutoDial={session.isAutoDial}
                  onSave={handleSave}
                />
              </StyledPanel>
            )}
          </>
        )}
      </StyledColumn>

      <StyledColumn>
        <StyledPanel style={{ flex: 1 }}>
          <h3>{t`Recent activity`}</h3>
          <StyledFeed>
            {isFinished || timeline.length === 0 ? (
              <StyledMuted>{t`Nothing logged yet.`}</StyledMuted>
            ) : (
              timeline
                .slice(0, 8)
                .map((item) => (
                  <PulseTimelineCard
                    key={item.id}
                    item={item}
                    onOpen={() => undefined}
                  />
                ))
            )}
          </StyledFeed>
        </StyledPanel>
      </StyledColumn>
    </StyledLayout>
  );
};
