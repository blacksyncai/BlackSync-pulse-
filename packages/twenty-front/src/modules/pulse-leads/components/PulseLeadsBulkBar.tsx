import { type LeadStatusOption } from '@/pulse-leads/hooks/useLeadStatusOptions';
import { usePulseLeadActions } from '@/pulse-leads/hooks/usePulseLeadActions';
import {
  useOutreachActions,
  useSequences,
} from '@/pulse-outreach/hooks/usePulseOutreach';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledBar = styled.div`
  align-items: center;
  background: ${themeCssVariables.font.color.primary};
  border-radius: 12px;
  bottom: 24px;
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.45);
  color: ${themeCssVariables.background.primary};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  left: 50%;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  position: fixed;
  transform: translateX(-50%);
  z-index: 30;

  select,
  input,
  button {
    border-radius: 8px;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 32px;
  }

  select,
  input {
    background: ${themeCssVariables.background.primary};
    border: 0;
    color: ${themeCssVariables.font.color.primary};
    padding: 0 ${themeCssVariables.spacing[2]};
  }

  button {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: inherit;
    cursor: pointer;
    padding: 0 ${themeCssVariables.spacing[3]};
  }

  button[data-tone='danger'] {
    border-color: ${themeCssVariables.color.red};
    color: ${themeCssVariables.color.red};
  }

  strong {
    margin-right: ${themeCssVariables.spacing[2]};
  }
`;

type PulseLeadsBulkBarProps = {
  selectedIds: string[];
  statusOptions: LeadStatusOption[];
  onDone: () => void;
  onClear: () => void;
};

export const PulseLeadsBulkBar = ({
  selectedIds,
  statusOptions,
  onDone,
  onClear,
}: PulseLeadsBulkBarProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { setStatus, assignToMe, addTaskToLeads, deleteLeads } =
    usePulseLeadActions();
  const { sequences } = useSequences();
  const { enroll } = useOutreachActions();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const count = selectedIds.length;

  const run = async (action: () => Promise<unknown>, message: string) => {
    setIsWorking(true);

    try {
      await action();
      enqueueToast({ variant: 'success', children: message });
      onDone();
    } catch {
      enqueueToast({
        variant: 'error',
        children: t`That didn't work. Try again.`,
      });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <StyledBar>
      <strong>{t`${count} selected`}</strong>
      {statusOptions.length > 0 && (
        <select
          aria-label={t`Set status`}
          value=""
          disabled={isWorking}
          onChange={(event) =>
            void run(
              () => setStatus(selectedIds, event.target.value || null),
              t`Status updated on ${count} leads`,
            )
          }
        >
          <option value="" disabled>
            {t`Set status...`}
          </option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      {isAddingTask ? (
        <>
          <input
            autoFocus
            placeholder={t`Task for each lead`}
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
          />
          <button
            type="button"
            disabled={isWorking || taskTitle.trim().length === 0}
            onClick={() => {
              const tomorrow = new Date();

              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              void run(
                () =>
                  addTaskToLeads(selectedIds, {
                    title: taskTitle,
                    dueAt: tomorrow,
                    isUrgent: false,
                  }),
                t`Added a task to ${count} leads, due tomorrow 9am`,
              ).then(() => {
                setTaskTitle('');
                setIsAddingTask(false);
              });
            }}
          >
            {t`Add`}
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setIsAddingTask(true)}>
          {t`Add task`}
        </button>
      )}
      {sequences.length > 0 && (
        <select
          aria-label={t`Add to sequence`}
          value=""
          disabled={isWorking}
          onChange={(event) => {
            const sequenceId = event.target.value;

            void run(
              async () => {
                const result = await enroll({
                  sequenceId,
                  companyIds: selectedIds,
                });

                enqueueToast({
                  variant: 'info',
                  children: t`${result?.enrolled ?? 0} added, ${result?.missingEmail ?? 0} without email, ${result?.alreadyEnrolled ?? 0} already in it`,
                });
              },
              t`Sequence updated`,
            );
          }}
        >
          <option value="" disabled>
            {t`Add to sequence...`}
          </option>
          {sequences.map((sequence) => (
            <option key={sequence.id} value={sequence.id}>
              {sequence.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={isWorking}
        onClick={() =>
          void run(
            () => assignToMe(selectedIds),
            t`Assigned ${count} leads to you`,
          )
        }
      >
        {t`Assign to me`}
      </button>
      <button
        type="button"
        data-tone="danger"
        disabled={isWorking}
        onClick={() => {
          if (window.confirm(t`Delete ${count} leads?`)) {
            void run(() => deleteLeads(selectedIds), t`Deleted ${count} leads`);
          }
        }}
      >
        {t`Delete`}
      </button>
      <button type="button" onClick={onClear}>
        {t`Clear`}
      </button>
    </StyledBar>
  );
};
