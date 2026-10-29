import {
  type PulseDealCardField,
  pulseDealCardSettingsState,
} from '@/pulse-opportunities/states/pulseDealCardSettingsState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconAdjustments } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledWrapper = styled.div`
  position: relative;
`;

const StyledButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: 6px;
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[aria-expanded='true'],
  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledBackdrop = styled.div`
  inset: 0;
  position: fixed;
  z-index: 40;
`;

const StyledMenu = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  box-shadow: 0 14px 32px -12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  min-width: 220px;
  padding: ${themeCssVariables.spacing[2]};
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 41;
`;

const StyledMenuTitle = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

const StyledOption = styled.label`
  align-items: center;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
  }

  input {
    accent-color: ${themeCssVariables.accent.accent9};
  }
`;

export const PulseDealCardSettingsButton = () => {
  const { t } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useAtomState(pulseDealCardSettingsState);

  const options: { field: PulseDealCardField; label: string }[] = [
    { field: 'value', label: t`Deal value` },
    { field: 'contact', label: t`Contact and quick actions` },
    { field: 'owner', label: t`Owner` },
    { field: 'website', label: t`Website` },
    { field: 'closeDate', label: t`Estimated close date` },
    { field: 'lastActivity', label: t`Last contacted` },
    { field: 'note', label: t`Note` },
  ];

  return (
    <StyledWrapper>
      <StyledButton
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <IconAdjustments size={16} />
        {t`Customize cards`}
      </StyledButton>
      {isOpen && (
        <>
          <StyledBackdrop onClick={() => setIsOpen(false)} />
          <StyledMenu>
            <StyledMenuTitle>{t`Show on cards`}</StyledMenuTitle>
            {options.map(({ field, label }) => (
              <StyledOption key={field}>
                <input
                  type="checkbox"
                  checked={fields[field]}
                  onChange={(event) =>
                    setFields((current) => ({
                      ...current,
                      [field]: event.target.checked,
                    }))
                  }
                />
                {label}
              </StyledOption>
            ))}
          </StyledMenu>
        </>
      )}
    </StyledWrapper>
  );
};
