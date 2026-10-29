import { type LeadStatusOption } from '@/pulse-leads/hooks/useLeadStatusOptions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledSelect = styled.select`
  appearance: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  max-width: 100%;
  overflow: hidden;
  padding: 3px 10px;
  text-overflow: ellipsis;
`;

const tagColor = (color: string | undefined) => {
  const key = (color ?? 'gray') as keyof typeof themeCssVariables.tag.text;

  return {
    background:
      themeCssVariables.tag.background[key] ??
      themeCssVariables.tag.background.gray,
    color: themeCssVariables.tag.text[key] ?? themeCssVariables.tag.text.gray,
  };
};

type PulseLeadStatusSelectProps = {
  value: string | null;
  options: LeadStatusOption[];
  onChange: (value: string | null) => void;
};

export const PulseLeadStatusSelect = ({
  value,
  options,
  onChange,
}: PulseLeadStatusSelectProps) => {
  const { t } = useLingui();
  const current = options.find((option) => option.value === value);

  return (
    <StyledSelect
      aria-label={t`Lead status`}
      value={value ?? ''}
      style={tagColor(current?.color)}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value || null)}
    >
      <option value="">{t`No status`}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </StyledSelect>
  );
};
