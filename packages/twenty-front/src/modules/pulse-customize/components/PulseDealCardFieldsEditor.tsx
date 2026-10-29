import {
  type PulseDealCardField,
  pulseDealCardSettingsState,
} from '@/pulse-opportunities/states/pulseDealCardSettingsState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

  label {
    align-items: center;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.primary};
    cursor: pointer;
    display: flex;
    font-size: ${themeCssVariables.font.size.md};
    gap: ${themeCssVariables.spacing[2]};
    padding: ${themeCssVariables.spacing[3]};
  }

  input {
    accent-color: ${themeCssVariables.accent.accent9};
  }
`;

export const PulseDealCardFieldsEditor = () => {
  const { t } = useLingui();
  const [settings, setSettings] = useAtomState(pulseDealCardSettingsState);
  const fields: { id: PulseDealCardField; label: string }[] = [
    { id: 'value', label: t`Deal value` },
    { id: 'contact', label: t`Contact with call/email/text` },
    { id: 'closeDate', label: t`Close date` },
    { id: 'lastActivity', label: t`Last contacted (call, email, text)` },
    { id: 'owner', label: t`Owner` },
    { id: 'website', label: t`Website` },
    { id: 'note', label: t`Deal note` },
  ];

  return (
    <StyledGrid>
      {fields.map((field) => (
        <label key={field.id}>
          <input
            type="checkbox"
            checked={settings[field.id]}
            onChange={(event) =>
              setSettings({ ...settings, [field.id]: event.target.checked })
            }
          />
          {field.label}
        </label>
      ))}
    </StyledGrid>
  );
};
