import {
  assignmentMemberName,
  usePulseAssignment,
  type PulseAssignment,
} from '@/pulse-assignment/contexts/PulseAssignmentContext';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';
const StyledPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  select {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    font: inherit;
    font-size: ${themeCssVariables.font.size.sm};
    padding: 6px 8px;
    min-width: 0;
    max-width: 100%;
  }
`;
type PulseAssignmentPickerProps = {
  value: PulseAssignment;
  onChange: (value: PulseAssignment) => void;
  disabled?: boolean;
  allowTeam?: boolean;
};
export const PulseAssignmentPicker = ({
  value,
  onChange,
  disabled = false,
  allowTeam = true,
}: PulseAssignmentPickerProps) => {
  const { t } = useLingui();
  const { members, teams, loading } = usePulseAssignment();
  const visibleTeams = teams.filter(
    (team) => !team.archived || team.id === value.teamValue,
  );
  return (
    <StyledPicker>
      <select
        aria-label={t`Assigned user`}
        value={value.memberId ?? ''}
        disabled={disabled || loading}
        onChange={(event) =>
          onChange({ ...value, memberId: event.target.value || null })
        }
      >
        <option value="">{t`Unassigned user`}</option>
        {value.memberId &&
          !members.some((member) => member.id === value.memberId) && (
            <option value={value.memberId}>{t`Unavailable member`}</option>
          )}
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {assignmentMemberName(member)}
          </option>
        ))}
      </select>
      {allowTeam && visibleTeams.length > 0 && (
        <select
          aria-label={t`Assigned team`}
          value={value.teamValue ?? ''}
          disabled={disabled || loading}
          onChange={(event) =>
            onChange({ ...value, teamValue: event.target.value || null })
          }
        >
          <option value="">{t`No team`}</option>
          {value.teamValue &&
            !visibleTeams.some((team) => team.id === value.teamValue) && (
              <option value={value.teamValue}>{t`Unavailable team`}</option>
            )}
          {visibleTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
              {team.archived ? t` (archived)` : ''}
            </option>
          ))}
        </select>
      )}
    </StyledPicker>
  );
};
