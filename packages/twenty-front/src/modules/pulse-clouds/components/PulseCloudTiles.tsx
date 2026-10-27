import { PULSE_CLOUDS } from '@/pulse-clouds/constants/PulseClouds';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconCheck } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

const StyledTiles = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 100%;
  width: 560px;
`;

const StyledTile = styled.button`
  align-items: flex-start;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
  position: relative;
  text-align: left;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: ${themeCssVariables.accent.accent7};
  }

  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.accent.accent9};
    box-shadow: 0 0 0 3px ${themeCssVariables.accent.quaternary};
  }

  &:disabled {
    cursor: default;
  }
`;

const StyledIcon = styled.span`
  align-items: center;
  background: ${themeCssVariables.accent.tertiary};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.accent.accent11};
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;
`;

const StyledCheck = styled.span`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 50%;
  box-sizing: border-box;
  color: ${themeCssVariables.grayScale.gray1};
  display: flex;
  height: 18px;
  justify-content: center;
  position: absolute;
  right: ${themeCssVariables.spacing[3]};
  top: ${themeCssVariables.spacing[3]};
  width: 18px;

  [aria-pressed='true'] > & {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
  }
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledDescription = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledHighlights = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledHighlight = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.xs};
  padding: 2px ${themeCssVariables.spacing[2]};
`;

type PulseCloudTilesProps = {
  selectedUniversalIdentifiers: string[];
  disabledUniversalIdentifiers?: string[];
  onToggle: (universalIdentifier: string) => void;
  disabled?: boolean;
};

export const PulseCloudTiles = ({
  selectedUniversalIdentifiers,
  disabledUniversalIdentifiers = [],
  onToggle,
  disabled,
}: PulseCloudTilesProps) => {
  const { t } = useLingui();
  const theme = useTheme();

  return (
    <StyledTiles>
      {PULSE_CLOUDS.map((cloud) => {
        const isSelected =
          selectedUniversalIdentifiers.includes(cloud.universalIdentifier) ||
          disabledUniversalIdentifiers.includes(cloud.universalIdentifier);

        return (
          <StyledTile
            key={cloud.universalIdentifier}
            type="button"
            aria-pressed={isSelected}
            disabled={
              disabled ||
              disabledUniversalIdentifiers.includes(cloud.universalIdentifier)
            }
            onClick={() => onToggle(cloud.universalIdentifier)}
          >
            <StyledIcon>
              <cloud.Icon size={theme.icon.size.lg} />
            </StyledIcon>
            <StyledLabel>{t(cloud.label)}</StyledLabel>
            <StyledDescription>{t(cloud.description)}</StyledDescription>
            <StyledHighlights>
              {cloud.highlights.map((highlight) => (
                <StyledHighlight key={highlight.id}>
                  {t(highlight)}
                </StyledHighlight>
              ))}
            </StyledHighlights>
            <StyledCheck aria-hidden>
              {isSelected && <IconCheck size={theme.icon.size.sm} stroke={3} />}
            </StyledCheck>
          </StyledTile>
        );
      })}
    </StyledTiles>
  );
};
