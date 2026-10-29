import {
  PULSE_DIALER_DISPOSITIONS,
  type PulseDialerDispositionId,
} from '@/pulse-dialer/constants/PulseDialerDispositions';
import { type PulseDialerOutcome } from '@/pulse-dialer/hooks/usePulseDialer';
import { type LeadStatusOption } from '@/pulse-leads/hooks/useLeadStatusOptions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  outline: none;

  textarea,
  select,
  input {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    padding: 8px 10px;
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(4, 1fr);
`;

const StyledDisposition = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: 6px;
  height: 40px;
  padding: 0 ${themeCssVariables.spacing[2]};

  kbd {
    color: ${themeCssVariables.font.color.light};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.xs};
  }

  &[aria-pressed='true'] {
    border-width: 2px;
    font-weight: ${themeCssVariables.font.weight.semiBold};
  }
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};

  label {
    align-items: center;
    color: ${themeCssVariables.font.color.secondary};
    display: flex;
    font-size: ${themeCssVariables.font.size.sm};
    gap: 6px;
  }
`;

const StyledSave = styled.button`
  background: ${themeCssVariables.accent.accent9};
  border: 0;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: 40px;
  margin-left: auto;
  padding: 0 ${themeCssVariables.spacing[5]};

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const toLocalInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

const tomorrowMorning = () => {
  const date = new Date();

  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);

  return toLocalInput(date);
};

type PulseDialerOutcomeProps = {
  wasAnswered: boolean;
  statusOptions: LeadStatusOption[];
  currentStatus: string | null;
  hasNext: boolean;
  isAutoDial: boolean;
  onSave: (outcome: PulseDialerOutcome) => Promise<void>;
};

export const PulseDialerOutcomePanel = ({
  wasAnswered,
  statusOptions,
  currentStatus,
  hasNext,
  isAutoDial,
  onSave,
}: PulseDialerOutcomeProps) => {
  const { t } = useLingui();
  const [disposition, setDisposition] = useState<PulseDialerDispositionId>(
    wasAnswered ? 'connected' : 'no_answer',
  );
  const [notes, setNotes] = useState('');
  const [leadStatus, setLeadStatus] = useState(currentStatus ?? '');
  const [isScheduling, setIsScheduling] = useState(false);
  const [callbackAt, setCallbackAt] = useState(tomorrowMorning);
  const [isSaving, setIsSaving] = useState(false);
  const shouldSchedule = isScheduling || disposition === 'callback';

  const save = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        disposition,
        notes,
        leadStatus:
          leadStatus !== (currentStatus ?? '') && leadStatus.length > 0
            ? leadStatus
            : null,
        callbackAt:
          shouldSchedule && callbackAt.length > 0 ? new Date(callbackAt) : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isTyping = event.target instanceof HTMLTextAreaElement;

    if (
      event.key === 'Enter' &&
      (event.metaKey || event.ctrlKey || !isTyping)
    ) {
      event.preventDefault();
      void save();

      return;
    }

    if (!isTyping) {
      const match = PULSE_DIALER_DISPOSITIONS.find(
        (option) => option.shortcut === event.key,
      );

      if (isDefined(match)) {
        setDisposition(match.id);
      }
    }
  };

  return (
    // Number keys pick an outcome and Enter saves, so a session runs from the keyboard.
    <StyledPanel tabIndex={-1} autoFocus onKeyDown={handleKeyDown}>
      <StyledGrid>
        {PULSE_DIALER_DISPOSITIONS.map((option) => (
          <StyledDisposition
            key={option.id}
            type="button"
            aria-pressed={disposition === option.id}
            style={
              disposition === option.id
                ? {
                    background:
                      themeCssVariables.tag.background[
                        option.color as keyof typeof themeCssVariables.tag.background
                      ],
                    borderColor:
                      themeCssVariables.tag.text[
                        option.color as keyof typeof themeCssVariables.tag.text
                      ],
                  }
                : undefined
            }
            onClick={() => setDisposition(option.id)}
          >
            <kbd>{option.shortcut}</kbd>
            {option.label}
          </StyledDisposition>
        ))}
      </StyledGrid>
      <textarea
        aria-label={t`Call notes`}
        placeholder={t`Notes from the call (saved on the lead's timeline)`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <StyledRow>
        {statusOptions.length > 0 && (
          <label>
            {t`Lead status`}
            <select
              value={leadStatus}
              onChange={(event) => setLeadStatus(event.target.value)}
            >
              <option value="">{t`No status`}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <input
            type="checkbox"
            checked={shouldSchedule}
            disabled={disposition === 'callback'}
            onChange={(event) => setIsScheduling(event.target.checked)}
          />
          {t`Follow-up task`}
        </label>
        {shouldSchedule && (
          <input
            type="datetime-local"
            aria-label={t`Follow-up time`}
            value={callbackAt}
            onChange={(event) => setCallbackAt(event.target.value)}
          />
        )}
        <StyledSave
          type="button"
          disabled={isSaving}
          onClick={() => void save()}
        >
          {isSaving
            ? t`Saving...`
            : hasNext
              ? isAutoDial
                ? t`Save & call next`
                : t`Save & next`
              : t`Save & finish`}
        </StyledSave>
      </StyledRow>
    </StyledPanel>
  );
};
