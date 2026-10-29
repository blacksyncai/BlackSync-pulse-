import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { usePulseTaskPriorityField } from '@/pulse-tasks/hooks/usePulseTaskPriorityField';
import { type PulseTask } from '@/pulse-tasks/types/PulseTask';
import { PULSE_URGENT_PRIORITY } from '@/pulse-tasks/utils/groupPulseTasks';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type PulseNewTask = {
  title: string;
  dueAt: Date | null;
  isUrgent: boolean;
  companyId?: string | null;
  personId?: string | null;
};

export type PulseNewNote = {
  body: string;
  companyId?: string | null;
  personId?: string | null;
};

export const usePulseTaskActions = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { hasPriority } = usePulseTaskPriorityField();
  const { createOneRecord: createTask } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const { createOneRecord: createTaskTarget } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.TaskTarget,
  });
  const { createOneRecord: createNote } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Note,
  });
  const { createOneRecord: createNoteTarget } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.NoteTarget,
  });
  const { updateOneRecord } = useUpdateOneRecord();

  const addTask = async ({
    title,
    dueAt,
    isUrgent,
    companyId,
    personId,
  }: PulseNewTask) => {
    const task = await createTask({
      title: title.trim(),
      status: 'TODO',
      dueAt: dueAt?.toISOString() ?? null,
      assigneeId: currentWorkspaceMember?.id ?? null,
      ...(hasPriority
        ? { priority: isUrgent ? PULSE_URGENT_PRIORITY : 'NORMAL' }
        : {}),
    });

    if (isDefined(companyId) || isDefined(personId)) {
      await createTaskTarget({
        taskId: task.id,
        targetCompanyId: companyId ?? null,
        targetPersonId: personId ?? null,
      });
    }

    return task;
  };

  const addNote = async ({ body, companyId, personId }: PulseNewNote) => {
    const trimmed = body.trim();
    const title = trimmed.split('\n')[0].slice(0, 80);
    const note = await createNote({
      title,
      bodyV2: { markdown: trimmed, blocknote: null },
    });

    if (isDefined(companyId) || isDefined(personId)) {
      await createNoteTarget({
        noteId: note.id,
        targetCompanyId: companyId ?? null,
        targetPersonId: personId ?? null,
      });
    }

    return note;
  };

  const updateTask = (taskId: string, update: Record<string, unknown>) =>
    updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Task,
      idToUpdate: taskId,
      updateOneRecordInput: update,
    });

  const toggleDone = (task: PulseTask) =>
    updateTask(task.id, {
      status: task.status === 'DONE' ? 'TODO' : 'DONE',
    });

  const toggleUrgent = (task: PulseTask) =>
    updateTask(task.id, {
      priority:
        task.priority === PULSE_URGENT_PRIORITY
          ? 'NORMAL'
          : PULSE_URGENT_PRIORITY,
    });

  const snooze = (task: PulseTask, days: number) => {
    const base = new Date(Math.max(Date.now(), task.dueAt?.getTime() ?? 0));
    const next = new Date(base);

    next.setDate(next.getDate() + days);

    if (!isDefined(task.dueAt)) {
      next.setHours(9, 0, 0, 0);
    }

    return updateTask(task.id, { dueAt: next.toISOString() });
  };

  return {
    addTask,
    addNote,
    toggleDone,
    toggleUrgent,
    snooze,
    hasPriority,
    currentWorkspaceMemberId: currentWorkspaceMember?.id ?? null,
  };
};
