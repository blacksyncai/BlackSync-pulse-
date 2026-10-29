import {
  type PulseNewTask,
  usePulseTaskActions,
} from '@/pulse-tasks/hooks/usePulseTaskActions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components';
import { IconFlag, IconPlus } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledForm = styled.form`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 12px;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  width: 100%;

  &:focus-within {
    border-color: ${themeCssVariables.accent.accent9};
  }
`;

const StyledTitleInput = styled.input`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  min-width: 180px;
  outline: none;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledDateInput = styled.input`
  background: ${themeCssVariables.background.transparent.light};
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledUrgentToggle = styled.button`
  align-items: center;
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.danger};
    border-color: ${themeCssVariables.border.color.danger};
    color: ${themeCssVariables.font.color.danger};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledSubmit = styled.button`
  align-items: center;
  background: ${themeCssVariables.accent.accent9};
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 4px;
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const toLocalInputValue = (date: Date) => {
  const offsetDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );

  return offsetDate.toISOString().slice(0, 16);
};

const defaultDueDate = () => {
  const date = new Date();

  date.setHours(date.getHours() + 1, 0, 0, 0);

  return toLocalInputValue(date);
};

type PulseTaskQuickAddProps = {
  companyId?: string | null;
  personId?: string | null;
  autoFocus?: boolean;
  onCreated?: () => void;
};

export const PulseTaskQuickAdd = ({
  companyId,
  personId,
  autoFocus = false,
  onCreated,
}: PulseTaskQuickAddProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { addTask, hasPriority } = usePulseTaskActions();
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(defaultDueDate);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (title.trim().length === 0 || isSaving) {
      return;
    }

    const newTask: PulseNewTask = {
      title,
      dueAt: dueAt.length > 0 ? new Date(dueAt) : null,
      isUrgent,
      companyId,
      personId,
    };

    setIsSaving(true);

    try {
      await addTask(newTask);
      setTitle('');
      setIsUrgent(false);
      setDueAt(defaultDueDate());
      onCreated?.();
    } catch {
      enqueueToast({ variant: 'error', children: t`Could not save the task.` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <StyledTitleInput
        autoFocus={autoFocus}
        aria-label={t`Task`}
        placeholder={t`Add a task, e.g. Follow up with Qawi`}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <StyledDateInput
        type="datetime-local"
        aria-label={t`Due`}
        value={dueAt}
        onChange={(event) => setDueAt(event.target.value)}
      />
      {hasPriority && (
        <StyledUrgentToggle
          type="button"
          aria-pressed={isUrgent}
          onClick={() => setIsUrgent(!isUrgent)}
        >
          <IconFlag size={14} />
          {t`Urgent`}
        </StyledUrgentToggle>
      )}
      <StyledSubmit type="submit" disabled={title.trim().length === 0}>
        <IconPlus size={14} />
        {t`Add task`}
      </StyledSubmit>
    </StyledForm>
  );
};
