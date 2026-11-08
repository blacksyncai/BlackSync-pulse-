import {
  formatSalesWorkspaceAmount,
  getSalesWorkspaceCloseDate,
} from '@/pulse-dashboard/utils/formatSalesWorkspaceDeal';
import { usePulseSalesWorkspace } from '@/pulse-dashboard/hooks/usePulseSalesWorkspace';
import { PulseTaskQuickAdd } from '@/pulse-tasks/components/PulseTaskQuickAdd';
import { PulseTaskRow } from '@/pulse-tasks/components/PulseTaskRow';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { usePulseTasks } from '@/pulse-tasks/hooks/usePulseTasks';
import { groupPulseTasks } from '@/pulse-tasks/utils/groupPulseTasks';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { IconLayoutDashboard } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledPage = styled.div`
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px;
  width: 100%;
  h1 {
    font-size: 32px;
    letter-spacing: -1px;
    margin: 8px 0 12px;
  }
  h2 {
    font-size: 17px;
    margin: 0;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.6;
    margin: 8px 0;
  }
  a {
    color: ${themeCssVariables.accent.accent11};
    text-decoration: none;
  }
  button,
  a {
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
  }
  @media (max-width: 640px) {
    padding: 16px;
    h1 {
      font-size: 26px;
    }
  }
`;
const StyledContent = styled.div`
  margin: 0 auto;
  max-width: 1320px;
`;
const StyledHero = styled.header`
  background: linear-gradient(
    120deg,
    ${themeCssVariables.accent.quaternary},
    transparent
  );
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 20px;
  margin-bottom: 24px;
  padding: 28px;
  img {
    height: 24px;
    vertical-align: middle;
    width: 24px;
    margin-right: 8px;
  }
  small {
    color: ${themeCssVariables.font.color.secondary};
    font-weight: 600;
    letter-spacing: 2px;
  }
  @media (max-width: 640px) {
    padding: 20px;
  }
`;
const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  a {
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 9px;
    padding: 10px 16px;
  }
  a:first-child {
    background: ${themeCssVariables.accent.accent9};
    border-color: transparent;
    color: white;
  }
`;
const StyledGrid = styled.div`
  display: grid;
  align-items: start;
  gap: 24px;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const StyledColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
`;
const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 16px;
  min-width: 0;
  overflow: hidden;
`;
const StyledPanelHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  padding: 20px;
`;
const StyledBody = styled.div`
  padding: 20px;
`;
const StyledButton = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font: inherit;
  padding: 7px 10px;
  &[aria-pressed='true'] {
    background: ${themeCssVariables.accent.quaternary};
    color: ${themeCssVariables.accent.accent11};
  }
  &:disabled {
    cursor: wait;
    opacity: 0.5;
  }
`;
const StyledTabs = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;
const StyledRecord = styled.button`
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  gap: 12px;
  justify-content: space-between;
  padding: 16px 20px;
  text-align: left;
  width: 100%;
  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
  > span {
    min-width: 0;
  }
  strong {
    display: block;
    overflow-wrap: anywhere;
  }
  small {
    color: ${themeCssVariables.font.color.secondary};
    display: block;
    line-height: 1.5;
    margin-top: 5px;
  }
  [data-overdue='true'] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const SectionState = ({
  loading,
  error,
  empty,
  retry,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  retry: () => void;
  children: ReactNode;
}) => {
  const { t } = useLingui();
  if (error)
    return (
      <StyledBody role="alert">
        <p>{t`This section couldn't load. Your other work is still available.`}</p>
        <StyledButton onClick={retry}>{t`Try again`}</StyledButton>
      </StyledBody>
    );
  if (loading && empty)
    return (
      <StyledBody role="status">{t`Getting your workspace ready…`}</StyledBody>
    );
  return <>{children}</>;
};

export const PulseDashboardPage = () => {
  const { t } = useLingui();
  const [scope, setScope] = useState<'mine' | 'team'>('mine');
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'someday'>(
    'today',
  );
  const { currentWorkspaceMemberId } = usePulseTaskActions();
  const tasks = usePulseTasks({
    assigneeId: scope === 'mine' ? currentWorkspaceMemberId : null,
    openOnly: true,
    limit: 60,
    skip: scope === 'mine' && currentWorkspaceMemberId === null,
  });
  const { deals, calls } = usePulseSalesWorkspace();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const now = new Date();
  const groups = groupPulseTasks(tasks.tasks, now);
  const visibleTasks =
    filter === 'today' ? [...groups.overdue, ...groups.today] : groups[filter];
  const dateFormat: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  const open = (objectNameSingular: string, recordId: string) =>
    openRecordInSidePanel({ objectNameSingular, recordId });

  return (
    <PageCardLayout
      header={<PageHeader title={t`Dashboard`} Icon={IconLayoutDashboard} />}
    >
      <StyledPage>
        <StyledContent>
          <StyledHero>
            <small>
              <img src="/images/integrations/blacksync-pulse-logo.svg" alt="" />
              BLACKSYNC CLOUD
            </small>
            <h1>{t`Make your next move.`}</h1>
            <p>{t`Your follow-ups, closing deals, and conversations. One place to get to work.`}</p>
            <StyledActions>
              <Link to={AppPath.PulseDialer}>{t`Start calling`}</Link>
              <Link to={AppPath.PulseLeads}>{t`Find a contact`}</Link>
              <Link to={AppPath.PulseOpportunities}>{t`Open pipeline`}</Link>
            </StyledActions>
          </StyledHero>
          <StyledGrid>
            <StyledColumn>
              <StyledPanel>
                <StyledPanelHeader>
                  <h2>{t`Capture the next step`}</h2>
                </StyledPanelHeader>
                <StyledBody>
                  <PulseTaskQuickAdd
                    onCreated={() => {
                      void tasks.refetch();
                    }}
                  />
                </StyledBody>
              </StyledPanel>
              <StyledPanel>
                <StyledPanelHeader>
                  <h2>{t`Follow-through`}</h2>
                  <StyledTabs aria-label={t`Task ownership`}>
                    <StyledButton
                      aria-pressed={scope === 'mine'}
                      onClick={() => setScope('mine')}
                    >{t`My work`}</StyledButton>
                    <StyledButton
                      aria-pressed={scope === 'team'}
                      onClick={() => setScope('team')}
                    >{t`Team`}</StyledButton>
                  </StyledTabs>
                </StyledPanelHeader>
                <StyledBody>
                  <StyledTabs aria-label={t`Task timing`}>
                    <StyledButton
                      aria-pressed={filter === 'today'}
                      onClick={() => setFilter('today')}
                    >{t`Due & overdue`}</StyledButton>
                    <StyledButton
                      aria-pressed={filter === 'upcoming'}
                      onClick={() => setFilter('upcoming')}
                    >{t`Upcoming`}</StyledButton>
                    <StyledButton
                      aria-pressed={filter === 'someday'}
                      onClick={() => setFilter('someday')}
                    >{t`Unscheduled`}</StyledButton>
                  </StyledTabs>
                </StyledBody>
                <SectionState
                  loading={tasks.loading}
                  error={tasks.error}
                  empty={tasks.tasks.length === 0}
                  retry={() => {
                    void tasks.refetch();
                  }}
                >
                  {visibleTasks.slice(0, 10).map((task) => (
                    <PulseTaskRow
                      key={task.id}
                      task={task}
                      now={now}
                      showAssignee={scope === 'team'}
                      onChanged={() => {
                        void tasks.refetch();
                      }}
                    />
                  ))}
                  {visibleTasks.length === 0 && (
                    <StyledBody>
                      <p>{t`No tasks in this view. Capture a next step above or check another view.`}</p>
                    </StyledBody>
                  )}
                  <StyledBody>
                    <Link to={AppPath.PulseTodo}>
                      {tasks.hasNextPage
                        ? t`See all tasks — showing the earliest 60 here`
                        : t`See all tasks`}{' '}
                      →
                    </Link>
                  </StyledBody>
                </SectionState>
              </StyledPanel>
            </StyledColumn>
            <StyledColumn>
              <StyledPanel>
                <StyledPanelHeader>
                  <div>
                    <h2>{t`Closing soon`}</h2>
                    <p>{t`Open deals due in the next 14 days, including overdue.`}</p>
                  </div>
                </StyledPanelHeader>
                <SectionState
                  loading={deals.loading}
                  error={deals.error}
                  empty={deals.records.length === 0}
                  retry={() => {
                    void deals.refetch();
                  }}
                >
                  {deals.records.map((deal) => {
                    const closeDate = getSalesWorkspaceCloseDate(
                      deal.closeDate,
                    );
                    const today = new Date(now);
                    today.setHours(0, 0, 0, 0);
                    const overdue = closeDate !== null && closeDate < today;
                    return (
                      <StyledRecord
                        key={deal.id}
                        onClick={() =>
                          open(CoreObjectNameSingular.Opportunity, deal.id)
                        }
                      >
                        <span>
                          <strong>{deal.name || t`Untitled deal`}</strong>
                          <small>{deal.company?.name}</small>
                          <small data-overdue={overdue}>
                            {overdue
                              ? t`Close date overdue`
                              : t`Expected close`}{' '}
                            ·{' '}
                            {closeDate?.toLocaleDateString(
                              undefined,
                              dateFormat,
                            ) ?? '—'}
                          </small>
                        </span>
                        <span>{formatSalesWorkspaceAmount(deal.amount)}</span>
                      </StyledRecord>
                    );
                  })}
                  {deals.records.length === 0 && (
                    <StyledBody>
                      <p>{t`No deals with a close date in this window. Add expected close dates in your pipeline to plan your week.`}</p>
                    </StyledBody>
                  )}
                  <StyledBody>
                    <Link to={AppPath.PulseOpportunities}>
                      {deals.hasNextPage
                        ? t`See all deals — showing the earliest 12 here`
                        : t`Review pipeline`}{' '}
                      →
                    </Link>
                  </StyledBody>
                </SectionState>
              </StyledPanel>
              <StyledPanel>
                <StyledPanelHeader>
                  <h2>{t`Recent calls`}</h2>
                  <StyledButton
                    disabled={calls.loading}
                    onClick={() => {
                      void calls.refetch();
                    }}
                  >{t`Refresh`}</StyledButton>
                </StyledPanelHeader>
                <SectionState
                  loading={calls.loading}
                  error={calls.error}
                  empty={calls.records.length === 0}
                  retry={() => {
                    void calls.refetch();
                  }}
                >
                  {calls.records.map((call) => (
                    <StyledRecord
                      key={call.id}
                      onClick={() => open(CoreObjectNameSingular.Note, call.id)}
                    >
                      <span>
                        <strong>{call.title || t`Call`}</strong>
                        <small>
                          {new Date(call.createdAt).toLocaleString()}
                        </small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </StyledRecord>
                  ))}
                  {calls.records.length === 0 && (
                    <StyledBody>
                      <p>{t`Your logged calls will appear here. Open a call to review its notes and any synced transcript.`}</p>
                      <Link to={AppPath.PulseDialer}>{t`Open dialer`} →</Link>
                    </StyledBody>
                  )}
                </SectionState>
              </StyledPanel>
            </StyledColumn>
          </StyledGrid>
        </StyledContent>
      </StyledPage>
    </PageCardLayout>
  );
};
