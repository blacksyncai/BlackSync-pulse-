import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { type PulseTask } from '@/pulse-tasks/types/PulseTask';
import { formatPulseTaskDue } from '@/pulse-tasks/utils/formatPulseTaskDue';
import {
  isPulseTaskDone,
  PULSE_URGENT_PRIORITY,
} from '@/pulse-tasks/utils/groupPulseTasks';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconBuildingSkyscraper,
  IconCalendarDue,
  IconFlag,
  IconSquare,
  IconSquareCheck,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  min-height: 48px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  &:hover [data-hover-action] {
    opacity: 1;
  }
`;

const StyledCheck = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex: none;
  padding: 0;

  &[aria-checked='true'] {
    color: ${themeCssVariables.accent.accent9};
  }
`;

const StyledMain = styled.button`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  font-family: inherit;
  gap: 2px;
  min-width: 0;
  padding: 0;
  text-align: left;
`;

const StyledTitle = styled.span`
  font-size: ${themeCssVariables.font.size.md};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-done='true'] {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: line-through;
  }
`;

const StyledMeta = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[3]};

  span {
    align-items: center;
    display: inline-flex;
    gap: 4px;
  }

  [data-overdue='true'] {
    color: ${themeCssVariables.font.color.danger};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledUrgentBadge = styled.span`
  background: ${themeCssVariables.background.transparent.danger};
  border-radius: 999px;
  color: ${themeCssVariables.font.color.danger};
  flex: none;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 2px 8px;
`;

const StyledHoverAction = styled.button`
  align-items: center;
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  flex: none;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
  height: 28px;
  opacity: 0;
  padding: 0 ${themeCssVariables.spacing[2]};

  &:hover {
    border-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }

  &[aria-pressed='true'] {
    color: ${themeCssVariables.font.color.danger};
    opacity: 1;
  }
`;

type PulseTaskRowProps = {
  task: PulseTask;
  now: Date;
  showAssignee?: boolean;
};

export const PulseTaskRow = ({
  task,
  now,
  showAssignee = false,
}: PulseTaskRowProps) => {
  const { t } = useLingui();
  const { toggleDone, toggleUrgent, snooze, hasPriority } =
    usePulseTaskActions();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const isDone = isPulseTaskDone(task);
  const isUrgent = task.priority === PULSE_URGENT_PRIORITY;
  const isOverdue =
    !isDone && isDefined(task.dueAt) && task.dueAt.getTime() < now.getTime();
  const accountLabel = task.target?.companyName ?? task.target?.personName;

  const openTask = () =>
    openRecordInSidePanel({
      recordId: task.id,
      objectNameSingular: CoreObjectNameSingular.Task,
    });

  const openAccount = () => {
    if (isDefined(task.target?.companyId)) {
      openRecordInSidePanel({
        recordId: task.target.companyId,
        objectNameSingular: CoreObjectNameSingular.Company,
      });
    } else if (isDefined(task.target?.personId)) {
      openRecordInSidePanel({
        recordId: task.target.personId,
        objectNameSingular: CoreObjectNameSingular.Person,
      });
    }
  };

  return (
    <StyledRow>
      <StyledCheck
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? t`Mark as not done` : t`Mark as done`}
        onClick={() => void toggleDone(task)}
      >
        {isDone ? <IconSquareCheck size={20} /> : <IconSquare size={20} />}
      </StyledCheck>
      <StyledMain type="button" onClick={openTask}>
        <StyledTitle data-done={isDone}>
          {task.title.length > 0 ? task.title : t`Untitled task`}
        </StyledTitle>
        <StyledMeta>
          {isDefined(task.dueAt) && (
            <span data-overdue={isOverdue}>
              <IconCalendarDue size={14} />
              {formatPulseTaskDue(task.dueAt, now)}
            </span>
          )}
          {showAssignee && isDefined(task.assigneeName) && (
            <span>{task.assigneeName}</span>
          )}
        </StyledMeta>
      </StyledMain>
      {isUrgent && <StyledUrgentBadge>{t`Urgent`}</StyledUrgentBadge>}
      {isDefined(accountLabel) && (
        <StyledHoverAction
          type="button"
          data-hover-action
          style={{ opacity: 1 }}
          onClick={openAccount}
        >
          <IconBuildingSkyscraper size={14} />
          {accountLabel}
        </StyledHoverAction>
      )}
      {!isDone && (
        <StyledHoverAction
          type="button"
          data-hover-action
          onClick={() => void snooze(task, 1)}
        >
          {t`+1 day`}
        </StyledHoverAction>
      )}
      {!isDone && hasPriority && (
        <StyledHoverAction
          type="button"
          data-hover-action
          aria-pressed={isUrgent}
          aria-label={isUrgent ? t`Remove urgent` : t`Mark urgent`}
          onClick={() => void toggleUrgent(task)}
        >
          <IconFlag size={14} />
        </StyledHoverAction>
      )}
    </StyledRow>
  );
};
