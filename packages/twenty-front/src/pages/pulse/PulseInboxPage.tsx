import {
  type PulseInboxItem,
  type PulseInboxView,
  usePulseInboxItems,
} from '@/pulse-inbox/hooks/usePulseInboxItems';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconCheck,
  IconCheckbox,
  IconInbox,
  IconMail,
  IconPhone,
} from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

type PulseInboxTab = 'primary' | 'emails' | 'calls' | 'tasks';

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
`;

const StyledBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
`;

const StyledTabs = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledTab = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }

  &[aria-pressed='true'] {
    background: ${themeCssVariables.accent.quaternary};
    color: ${themeCssVariables.font.color.primary};
    box-shadow: inset 0 0 0 1px ${themeCssVariables.accent.accent6};
  }
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledSegment = styled.div`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: 2px;
  padding: 2px;
`;

const StyledSegmentButton = styled.button`
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 26px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.primary};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  cursor: pointer;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledKindIcon = styled.span`
  align-items: center;
  background: ${themeCssVariables.accent.quaternary};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.accent.accent11};
  display: flex;
  flex: none;
  height: 30px;
  justify-content: center;
  width: 30px;
`;

const StyledText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-done='true'] & {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: line-through;
  }
`;

const StyledSubtitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex: none;
  font-size: ${themeCssVariables.font.size.sm};

  &[data-overdue='true'] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledDoneButton = styled.button`
  align-items: center;
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 50%;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 24px;
  justify-content: center;
  width: 24px;

  &:hover,
  &[data-done='true'] {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
    color: #fff;
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[10]} ${themeCssVariables.spacing[4]};
  text-align: center;
`;

const formatDate = (date: Date | null) => {
  if (!isDefined(date)) return '';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const PulseInboxPage = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const [tab, setTab] = useState<PulseInboxTab>('primary');
  const [view, setView] = useState<PulseInboxView>('todo');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const { tasks, emails, loading } = usePulseInboxItems(view);
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { updateOneRecord } = useUpdateOneRecord();

  const primary = [...tasks, ...emails].sort((a, b) => {
    // Overdue and due-today work first, then the newest mail.
    if (a.kind !== b.kind) return a.kind === 'task' ? -1 : 1;
    return (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);
  });

  const itemsByTab: Record<PulseInboxTab, PulseInboxItem[]> = {
    primary,
    emails,
    calls: [],
    tasks,
  };
  const items = itemsByTab[tab];

  const handleToggleDone = async (item: PulseInboxItem) => {
    const isDone = item.isDone || completedIds.includes(item.id);
    setCompletedIds((current) =>
      isDone ? current.filter((id) => id !== item.id) : [...current, item.id],
    );
    await updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Task,
      idToUpdate: item.openRecordId,
      updateOneRecordInput: { status: isDone ? 'TODO' : 'DONE' },
    });
  };

  const tabs: { id: PulseInboxTab; label: string; count?: number }[] = [
    { id: 'primary', label: t`Primary`, count: primary.length },
    { id: 'emails', label: t`Emails`, count: emails.length },
    { id: 'calls', label: t`Calls` },
    { id: 'tasks', label: t`Tasks`, count: tasks.length },
  ];

  const kindIcon = (kind: PulseInboxItem['kind']) => {
    switch (kind) {
      case 'email':
        return <IconMail size={theme.icon.size.md} />;
      case 'call':
        return <IconPhone size={theme.icon.size.md} />;
      default:
        return <IconCheckbox size={theme.icon.size.md} />;
    }
  };

  const emptyMessage =
    tab === 'calls'
      ? t`Calls show up here once click-to-call logging is on.`
      : view === 'done'
        ? t`Nothing completed yet.`
        : view === 'future'
          ? t`Nothing scheduled ahead.`
          : t`You're all caught up.`;

  return (
    <PageCardLayout header={<PageHeader title={t`Inbox`} Icon={IconInbox} />}>
      <StyledPage>
        <StyledBar>
          <StyledTabs>
            {tabs.map((item) => (
              <StyledTab
                key={item.id}
                type="button"
                aria-pressed={tab === item.id}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {isDefined(item.count) && (
                  <StyledCount>{item.count}</StyledCount>
                )}
              </StyledTab>
            ))}
          </StyledTabs>
          <StyledSegment>
            {(
              [
                ['todo', t`To do`],
                ['future', t`Future`],
                ['done', t`Done`],
              ] as const
            ).map(([id, label]) => (
              <StyledSegmentButton
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
              >
                {label}
              </StyledSegmentButton>
            ))}
          </StyledSegment>
        </StyledBar>
        <StyledList>
          {!loading && items.length === 0 && (
            <StyledEmpty>{emptyMessage}</StyledEmpty>
          )}
          {items.map((item) => {
            const isDone = item.isDone || completedIds.includes(item.id);
            return (
              <StyledRow
                key={item.id}
                data-done={isDone}
                onClick={() =>
                  openRecordInSidePanel({
                    recordId: item.openRecordId,
                    objectNameSingular: item.openObjectNameSingular,
                  })
                }
              >
                <StyledKindIcon>{kindIcon(item.kind)}</StyledKindIcon>
                <StyledText>
                  <StyledTitle>{item.title}</StyledTitle>
                  {item.subtitle && (
                    <StyledSubtitle>{item.subtitle}</StyledSubtitle>
                  )}
                </StyledText>
                <StyledDate data-overdue={item.isOverdue && !isDone}>
                  {formatDate(item.date)}
                </StyledDate>
                {item.kind === 'task' && (
                  <StyledDoneButton
                    type="button"
                    data-done={isDone}
                    aria-label={isDone ? t`Mark as not done` : t`Mark as done`}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleToggleDone(item);
                    }}
                  >
                    <IconCheck size={theme.icon.size.sm} stroke={3} />
                  </StyledDoneButton>
                )}
              </StyledRow>
            );
          })}
        </StyledList>
      </StyledPage>
    </PageCardLayout>
  );
};
