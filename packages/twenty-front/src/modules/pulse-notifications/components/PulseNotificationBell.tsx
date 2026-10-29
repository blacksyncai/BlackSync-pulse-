import {
  canUseDesktopNotifications,
  useDesktopTaskAlerts,
} from '@/pulse-notifications/hooks/useDesktopTaskAlerts';
import { isTaskNeedingAttention } from '@/pulse-notifications/utils/getDueTaskAlerts';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { usePulseTasks } from '@/pulse-tasks/hooks/usePulseTasks';
import { formatPulseTaskDue } from '@/pulse-tasks/utils/formatPulseTaskDue';
import { PULSE_URGENT_PRIORITY } from '@/pulse-tasks/utils/groupPulseTasks';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconBell, IconSquare } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const PANEL_WIDTH = 360;

const StyledTrigger = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  height: 24px;
  justify-content: center;
  position: relative;
  width: 24px;

  &:hover,
  &[aria-expanded='true'] {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledBadge = styled.span`
  background: ${themeCssVariables.color.red};
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 14px;
  min-width: 14px;
  padding: 0 3px;
  position: absolute;
  right: -4px;
  text-align: center;
  top: -4px;
`;

const StyledBackdrop = styled.div`
  inset: 0;
  position: fixed;
  z-index: 40;
`;

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  position: fixed;
  width: ${PANEL_WIDTH}px;
  z-index: 41;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledList = styled.div`
  overflow-y: auto;
`;

const StyledItem = styled.button`
  align-items: flex-start;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledItemText = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.md};
  gap: 2px;
  min-width: 0;
`;

const StyledItemMeta = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};

  &[data-overdue='true'] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledUrgent = styled.span`
  background: ${themeCssVariables.background.transparent.danger};
  border-radius: 999px;
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: 2px 8px;
`;

const StyledFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledLinkButton = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.accent.accent10};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 0;
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[6]} ${themeCssVariables.spacing[4]};
  text-align: center;
`;

export const PulseNotificationBell = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { currentWorkspaceMemberId } = usePulseTaskActions();
  const { tasks, refetch } = usePulseTasks({
    assigneeId: currentWorkspaceMemberId,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [permission, setPermission] = useState(() =>
    canUseDesktopNotifications() ? Notification.permission : 'denied',
  );

  useDesktopTaskAlerts({ tasks, refetch });

  const now = Date.now();
  const attentionTasks = tasks
    .filter((task) => isTaskNeedingAttention(task, now))
    .sort(
      (left, right) =>
        Number(right.priority === PULSE_URGENT_PRIORITY) -
          Number(left.priority === PULSE_URGENT_PRIORITY) ||
        (left.dueAt?.getTime() ?? 0) - (right.dueAt?.getTime() ?? 0),
    );
  const isOpen = isDefined(panelPosition);

  const handleToggle = () => {
    if (isOpen) {
      setPanelPosition(null);

      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();

    setPanelPosition({
      top: (rect?.bottom ?? 40) + 8,
      left: Math.min(rect?.left ?? 16, window.innerWidth - PANEL_WIDTH - 16),
    });
  };

  const handleEnableDesktop = async () => {
    if (canUseDesktopNotifications()) {
      setPermission(await Notification.requestPermission());
    }
  };

  const openTodo = () => {
    setPanelPosition(null);
    navigate(AppPath.PulseTodo);
  };

  return (
    <>
      <StyledTrigger
        ref={triggerRef}
        type="button"
        aria-label={t`Notifications`}
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <IconBell size={16} />
        {attentionTasks.length > 0 && (
          <StyledBadge>
            {attentionTasks.length > 99 ? '99+' : attentionTasks.length}
          </StyledBadge>
        )}
      </StyledTrigger>
      {isOpen && (
        <>
          <StyledBackdrop onClick={() => setPanelPosition(null)} />
          <StyledPanel style={panelPosition}>
            <StyledHeader>
              {t`Notifications`}
              <StyledLinkButton type="button" onClick={openTodo}>
                {t`Open to-do`}
              </StyledLinkButton>
            </StyledHeader>
            <StyledList>
              {attentionTasks.length === 0 ? (
                <StyledEmpty>{t`You're all caught up.`}</StyledEmpty>
              ) : (
                attentionTasks.map((task) => {
                  const isOverdue = (task.dueAt?.getTime() ?? 0) < now;

                  return (
                    <StyledItem
                      key={task.id}
                      type="button"
                      onClick={() => {
                        setPanelPosition(null);
                        openRecordInSidePanel({
                          recordId: task.id,
                          objectNameSingular: CoreObjectNameSingular.Task,
                        });
                      }}
                    >
                      <IconSquare size={18} />
                      <StyledItemText>
                        {task.title.length > 0 ? task.title : t`Untitled task`}
                        <StyledItemMeta data-overdue={isOverdue}>
                          {isOverdue ? t`Overdue` : t`Due`} ·{' '}
                          {isDefined(task.dueAt) &&
                            formatPulseTaskDue(task.dueAt, new Date(now))}
                          {isDefined(task.target?.companyName) &&
                            ` · ${task.target.companyName}`}
                        </StyledItemMeta>
                      </StyledItemText>
                      {task.priority === PULSE_URGENT_PRIORITY && (
                        <StyledUrgent>{t`Urgent`}</StyledUrgent>
                      )}
                    </StyledItem>
                  );
                })
              )}
            </StyledList>
            <StyledFooter>
              {permission === 'granted' ? (
                <StyledItemMeta>
                  {t`Desktop alerts are on. You also get an email when a task is assigned to you or due soon.`}
                </StyledItemMeta>
              ) : permission === 'denied' ? (
                <StyledItemMeta>
                  {t`Desktop alerts are blocked in your browser settings.`}
                </StyledItemMeta>
              ) : (
                <StyledLinkButton
                  type="button"
                  onClick={() => void handleEnableDesktop()}
                >
                  {t`Turn on desktop alerts`}
                </StyledLinkButton>
              )}
            </StyledFooter>
          </StyledPanel>
        </>
      )}
    </>
  );
};
