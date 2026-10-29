import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledForm = styled.form`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.accent.accent9};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledTextarea = styled.textarea`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  min-height: 96px;
  outline: none;
  resize: vertical;
`;

const StyledButtons = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledButton = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[type='submit'] {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
    color: #fff;
    font-weight: ${themeCssVariables.font.weight.medium};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

type PulseNoteComposerProps = {
  companyId: string;
  onDone: () => void;
};

export const PulseNoteComposer = ({
  companyId,
  onDone,
}: PulseNoteComposerProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { addNote } = usePulseTaskActions();
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (body.trim().length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await addNote({ body, companyId });
      setBody('');
      onDone();
    } catch {
      enqueueToast({ variant: 'error', children: t`Could not save the note.` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <StyledTextarea
        autoFocus
        aria-label={t`Note`}
        placeholder={t`Write a note...`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <StyledButtons>
        <StyledButton type="button" onClick={onDone}>
          {t`Cancel`}
        </StyledButton>
        <StyledButton type="submit" disabled={body.trim().length === 0}>
          {isSaving ? t`Saving...` : t`Save note`}
        </StyledButton>
      </StyledButtons>
    </StyledForm>
  );
};
