import { PulseTaskQuickAdd } from '@/pulse-tasks/components/PulseTaskQuickAdd';
import { PulseTaskRow } from '@/pulse-tasks/components/PulseTaskRow';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { usePulseTasks } from '@/pulse-tasks/hooks/usePulseTasks';
import { type PulseTaskGroupId } from '@/pulse-tasks/types/PulseTask';
import {
  groupPulseTasks,
  PULSE_URGENT_PRIORITY,
} from '@/pulse-tasks/utils/groupPulseTasks';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconCheckbox } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

type Scope = 'mine' | 'everyone';

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  height: 100%;
  margin: 0 auto;
  max-width: 960px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[6]};
  width: 100%;
`;

const StyledToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledStats = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
`;

const StyledStat = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;

  strong {
    color: ${themeCssVariables.font.color.primary};
    font-size: 24px;
  }

  &[data-tone='danger'] strong {
    color: ${themeCssVariables.font.color.danger};
  }

  &[role='button'] {
    cursor: pointer;
  }

  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.accent.accent9};
  }
`;

const StyledPill = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: 6px 12px;

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledGroup = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  overflow: hidden;
`;

const StyledGroupTitle = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.transparent.lighter};
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  letter-spacing: 0.04em;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  text-transform: uppercase;
  width: 100%;

  &[data-tone='danger'] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[10]};
  text-align: center;
`;

export const PulseTodoPage = () => {
  const { t } = useLingui();
  const { currentWorkspaceMemberId } = usePulseTaskActions();
  const [scope, setScope] = useState<Scope>('mine');
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<PulseTaskGroupId[]>(['done']);
  const { tasks, loading } = usePulseTasks({
    assigneeId: scope === 'mine' ? currentWorkspaceMemberId : null,
  });

  const now = new Date();
  const visibleTasks = isUrgentOnly
    ? tasks.filter((task) => task.priority === PULSE_URGENT_PRIORITY)
    : tasks;
  const groups = groupPulseTasks(visibleTasks, now);
  const allGroups = groupPulseTasks(tasks, now);
  const urgentOpenCount = tasks.filter(
    (task) => task.priority === PULSE_URGENT_PRIORITY && task.status !== 'DONE',
  ).length;

  const sections: {
    id: PulseTaskGroupId;
    label: string;
    isDanger?: boolean;
  }[] = [
    { id: 'overdue', label: t`Overdue`, isDanger: true },
    { id: 'today', label: t`Today` },
    { id: 'upcoming', label: t`Upcoming` },
    { id: 'someday', label: t`No due date` },
    { id: 'done', label: t`Done this week` },
  ];

  const toggleCollapsed = (groupId: PulseTaskGroupId) =>
    setCollapsed(
      collapsed.includes(groupId)
        ? collapsed.filter((id) => id !== groupId)
        : [...collapsed, groupId],
    );

  const hasAnyTask = sections.some(({ id }) => groups[id].length > 0);

  return (
    <PageCardLayout
      header={<PageHeader title={t`To-do`} Icon={IconCheckbox} />}
    >
      <StyledPage>
        <StyledStats>
          <StyledStat data-tone="danger">
            {t`Overdue`}
            <strong>{allGroups.overdue.length}</strong>
          </StyledStat>
          <StyledStat>
            {t`Due today`}
            <strong>{allGroups.today.length}</strong>
          </StyledStat>
          <StyledStat
            role="button"
            tabIndex={0}
            data-tone="danger"
            aria-pressed={isUrgentOnly}
            onClick={() => setIsUrgentOnly(!isUrgentOnly)}
          >
            {t`Urgent`}
            <strong>{urgentOpenCount}</strong>
          </StyledStat>
          <StyledStat>
            {t`Done this week`}
            <strong>{allGroups.done.length}</strong>
          </StyledStat>
        </StyledStats>

        <PulseTaskQuickAdd autoFocus />

        <StyledToolbar>
          <StyledPill
            type="button"
            aria-pressed={scope === 'mine'}
            onClick={() => setScope('mine')}
          >
            {t`My tasks`}
          </StyledPill>
          <StyledPill
            type="button"
            aria-pressed={scope === 'everyone'}
            onClick={() => setScope('everyone')}
          >
            {t`Everyone`}
          </StyledPill>
          <StyledPill
            type="button"
            aria-pressed={isUrgentOnly}
            onClick={() => setIsUrgentOnly(!isUrgentOnly)}
          >
            {t`Urgent only`}
          </StyledPill>
        </StyledToolbar>

        {!hasAnyTask && !loading && (
          <StyledEmpty>{t`Nothing to do. Add a task above.`}</StyledEmpty>
        )}

        {sections
          .filter(({ id }) => groups[id].length > 0)
          .map(({ id, label, isDanger }) => (
            <StyledGroup key={id}>
              <StyledGroupTitle
                type="button"
                data-tone={isDanger ? 'danger' : undefined}
                aria-expanded={!collapsed.includes(id)}
                onClick={() => toggleCollapsed(id)}
              >
                {label} · {groups[id].length}
              </StyledGroupTitle>
              {!collapsed.includes(id) &&
                groups[id].map((task) => (
                  <PulseTaskRow
                    key={task.id}
                    task={task}
                    now={now}
                    showAssignee={scope === 'everyone'}
                  />
                ))}
            </StyledGroup>
          ))}
      </StyledPage>
    </PageCardLayout>
  );
};
