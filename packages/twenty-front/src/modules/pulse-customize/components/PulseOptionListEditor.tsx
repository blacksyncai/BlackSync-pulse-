import { PULSE_TAG_COLORS } from '@/pulse-customize/constants/PulseTagColors';
import { type EditableSelectOption } from '@/pulse-customize/hooks/useSaveSelectOptions';
import {
  makeUnique,
  toSelectOptionValue,
} from '@/pulse-pipelines/utils/buildPulsePipelineIdentifiers';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconPlus,
  IconTrash,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { v4 } from 'uuid';

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};

  input {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    flex: 1;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 34px;
    min-width: 0;
    padding: 0 ${themeCssVariables.spacing[2]};
  }
`;

const StyledSwatches = styled.div`
  display: flex;
  flex: none;
  gap: 3px;
`;

const StyledSwatch = styled.button`
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  height: 18px;
  padding: 0;
  width: 18px;

  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 28px;
  justify-content: center;
  width: 28px;

  &:hover:not(:disabled) {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;

const StyledFooter = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  margin-top: ${themeCssVariables.spacing[2]};
`;

const StyledButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 4px;
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[data-primary='true'] {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
    color: #fff;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

type PulseOptionListEditorProps = {
  options: EditableSelectOption[];
  addLabel: string;
  onSave: (options: EditableSelectOption[]) => Promise<boolean>;
};

export const PulseOptionListEditor = ({
  options,
  addLabel,
  onSave,
}: PulseOptionListEditorProps) => {
  const { t } = useLingui();
  const [draft, setDraft] = useState<EditableSelectOption[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const current = draft ?? options;
  const hasChanges = draft !== null;

  const update = (index: number, patch: Partial<EditableSelectOption>) =>
    setDraft(
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );

  const move = (index: number, offset: number) => {
    const next = [...current];
    const [moved] = next.splice(index, 1);

    next.splice(index + offset, 0, moved);
    setDraft(next);
  };

  const add = () =>
    setDraft([
      ...current,
      {
        id: v4(),
        label: '',
        value: '',
        color: PULSE_TAG_COLORS[current.length % PULSE_TAG_COLORS.length],
        position: current.length,
      },
    ]);

  const save = async () => {
    const takenValues: string[] = [];
    const prepared = current
      .filter((option) => option.label.trim().length > 0)
      .map((option) => {
        const value =
          option.value.length > 0
            ? option.value
            : makeUnique(toSelectOptionValue(option.label), [
                ...takenValues,
                ...current.map((existing) => existing.value),
              ]);

        takenValues.push(value);

        return { ...option, value };
      });

    setIsSaving(true);

    try {
      if (await onSave(prepared)) {
        setDraft(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledList>
      {current.map((option, index) => (
        <StyledRow key={option.id}>
          <StyledSwatches>
            {PULSE_TAG_COLORS.map((color) => (
              <StyledSwatch
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={option.color === color}
                style={{
                  background:
                    themeCssVariables.tag.background[
                      color as keyof typeof themeCssVariables.tag.background
                    ],
                }}
                onClick={() => update(index, { color })}
              />
            ))}
          </StyledSwatches>
          <input
            aria-label={t`Name`}
            value={option.label}
            placeholder={t`Name`}
            style={{
              color:
                themeCssVariables.tag.text[
                  option.color as keyof typeof themeCssVariables.tag.text
                ],
            }}
            onChange={(event) => update(index, { label: event.target.value })}
          />
          <StyledIconButton
            type="button"
            aria-label={t`Move up`}
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            <IconArrowUp size={16} />
          </StyledIconButton>
          <StyledIconButton
            type="button"
            aria-label={t`Move down`}
            disabled={index === current.length - 1}
            onClick={() => move(index, 1)}
          >
            <IconArrowDown size={16} />
          </StyledIconButton>
          <StyledIconButton
            type="button"
            aria-label={t`Remove`}
            onClick={() =>
              setDraft(
                current.filter((_, optionIndex) => optionIndex !== index),
              )
            }
          >
            <IconTrash size={16} />
          </StyledIconButton>
        </StyledRow>
      ))}
      <StyledFooter>
        <StyledButton type="button" onClick={add}>
          <IconPlus size={14} />
          {addLabel}
        </StyledButton>
        {hasChanges && (
          <div style={{ display: 'flex', gap: 8 }}>
            <StyledButton type="button" onClick={() => setDraft(null)}>
              {t`Discard`}
            </StyledButton>
            <StyledButton
              type="button"
              data-primary
              disabled={isSaving}
              onClick={() => void save()}
            >
              {isSaving ? t`Saving...` : t`Save changes`}
            </StyledButton>
          </div>
        )}
      </StyledFooter>
    </StyledList>
  );
};
