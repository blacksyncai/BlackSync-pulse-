import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type PulseInboxView = 'todo' | 'future' | 'done';

export type PulseInboxItem = {
  id: string;
  kind: 'task' | 'email' | 'call';
  title: string;
  subtitle: string;
  date: Date | null;
  isOverdue: boolean;
  isDone: boolean;
  openRecordId: string;
  openObjectNameSingular: string;
};

type TaskRow = {
  id: string;
  title: string | null;
  status: string | null;
  dueAt: string | null;
  bodyV2: { markdown: string | null } | null;
  __typename: string;
};

type MessageRow = {
  id: string;
  subject: string | null;
  text: string | null;
  receivedAt: string | null;
  messageThreadId: string;
  messageParticipants: { handle: string; displayName: string; role: string }[];
  __typename: string;
};

const EMAIL_LOOKBACK_DAYS = 14;

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

export const usePulseInboxItems = (view: PulseInboxView) => {
  const { records: tasks, loading: tasksLoading } = useFindManyRecords<TaskRow>(
    {
      objectNameSingular: CoreObjectNameSingular.Task,
      recordGqlFields: {
        id: true,
        title: true,
        status: true,
        dueAt: true,
        bodyV2: { markdown: true },
      },
      orderBy: [{ dueAt: 'AscNullsLast' }],
      limit: 200,
    },
  );

  const since = new Date();
  since.setDate(since.getDate() - EMAIL_LOOKBACK_DAYS);

  const { records: messages, loading: messagesLoading } =
    useFindManyRecords<MessageRow>({
      objectNameSingular: CoreObjectNameSingular.Message,
      recordGqlFields: {
        id: true,
        subject: true,
        text: true,
        receivedAt: true,
        messageThreadId: true,
        messageParticipants: { handle: true, displayName: true, role: true },
      },
      filter: { receivedAt: { gte: since.toISOString() } },
      orderBy: [{ receivedAt: 'DescNullsLast' }],
      limit: 60,
      skip: view !== 'todo',
    });

  const items = useMemo(() => {
    const todayEnd = endOfToday();
    const now = new Date();

    const taskItems: PulseInboxItem[] = tasks
      .filter((task) => {
        const isDone = task.status === 'DONE';
        const dueAt = isDefined(task.dueAt) ? new Date(task.dueAt) : null;
        if (view === 'done') return isDone;
        if (isDone) return false;
        if (view === 'future') return isDefined(dueAt) && dueAt > todayEnd;
        return !isDefined(dueAt) || dueAt <= todayEnd;
      })
      .map((task) => {
        const dueAt = isDefined(task.dueAt) ? new Date(task.dueAt) : null;
        return {
          id: `task-${task.id}`,
          kind: 'task',
          title: task.title || 'Untitled task',
          subtitle: (task.bodyV2?.markdown ?? '')
            .replace(/\s+/g, ' ')
            .slice(0, 120),
          date: dueAt,
          isOverdue: isDefined(dueAt) && dueAt < now && task.status !== 'DONE',
          isDone: task.status === 'DONE',
          openRecordId: task.id,
          openObjectNameSingular: CoreObjectNameSingular.Task,
        };
      });

    // Only inbound mail belongs in the inbox; the sender is the participant with the "from" role.
    const emailItems: PulseInboxItem[] =
      view === 'todo'
        ? messages.map((message) => {
            const sender = message.messageParticipants.find(
              (participant) => participant.role?.toLowerCase() === 'from',
            );
            return {
              id: `email-${message.id}`,
              kind: 'email',
              title: message.subject || '(no subject)',
              subtitle: `${sender?.displayName || sender?.handle || 'Unknown sender'} · ${(message.text ?? '').replace(/\s+/g, ' ').slice(0, 100)}`,
              date: isDefined(message.receivedAt)
                ? new Date(message.receivedAt)
                : null,
              isOverdue: false,
              isDone: false,
              openRecordId: message.messageThreadId,
              openObjectNameSingular: CoreObjectNameSingular.MessageThread,
            };
          })
        : [];

    return { tasks: taskItems, emails: emailItems };
  }, [tasks, messages, view]);

  return { ...items, loading: tasksLoading || messagesLoading };
};
