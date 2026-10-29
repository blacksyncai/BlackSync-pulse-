import { type LeadStatusOption } from '@/pulse-leads/hooks/useLeadStatusOptions';
import {
  type PulseLastContactFilter,
  type PulseSmartViewFilters,
} from '@/pulse-leads/types/PulseSmartView';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconChevronDown, IconSearch } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledBar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSearch = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  height: 34px;
  min-width: 220px;
  padding: 0 ${themeCssVariables.spacing[3]};

  input {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.font.color.primary};
    flex: 1;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    outline: none;
  }
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[2]};

  &[data-active='true'] {
    background: ${themeCssVariables.accent.quaternary};
    border-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }
`;

const StyledChip = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: 4px;
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[aria-pressed='true'] {
    background: ${themeCssVariables.accent.quaternary};
    border-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }
`;

const StyledPopoverAnchor = styled.div`
  position: relative;
`;

const StyledPopover = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  left: 0;
  max-height: 360px;
  min-width: 220px;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]};
  position: absolute;
  top: 40px;
  z-index: 30;

  label {
    align-items: center;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    font-size: ${themeCssVariables.font.size.md};
    gap: ${themeCssVariables.spacing[2]};
    padding: 6px 8px;
  }

  label:hover {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledBackdrop = styled.div`
  inset: 0;
  position: fixed;
  z-index: 29;
`;

const StyledClear = styled.button`
  background: transparent;
  border: 0;
  color: ${themeCssVariables.accent.accent10};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
`;

type PulseLeadsFilterBarProps = {
  filters: PulseSmartViewFilters;
  statusOptions: LeadStatusOption[];
  onChange: (filters: PulseSmartViewFilters) => void;
  onClear: () => void;
  hasChanges: boolean;
};

export const PulseLeadsFilterBar = ({
  filters,
  statusOptions,
  onChange,
  onClear,
  hasChanges,
}: PulseLeadsFilterBarProps) => {
  const { t } = useLingui();
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const update = (patch: Partial<PulseSmartViewFilters>) =>
    onChange({ ...filters, ...patch });

  const toggleStatus = (value: string) =>
    update({
      statuses: filters.statuses.includes(value)
        ? filters.statuses.filter((status) => status !== value)
        : [...filters.statuses, value],
    });

  const statusLabel =
    filters.statuses.length === 0
      ? t`Any status`
      : filters.statuses.length === 1
        ? (statusOptions.find((option) => option.value === filters.statuses[0])
            ?.label ?? t`1 status`)
        : t`${filters.statuses.length} statuses`;

  return (
    <StyledBar>
      <StyledSearch>
        <IconSearch size={16} />
        <input
          value={filters.search}
          placeholder={t`Search leads, contacts, emails, phones`}
          onChange={(event) => update({ search: event.target.value })}
        />
      </StyledSearch>

      {statusOptions.length > 0 && (
        <StyledPopoverAnchor>
          <StyledChip
            type="button"
            aria-pressed={filters.statuses.length > 0}
            onClick={() => setIsStatusOpen(!isStatusOpen)}
          >
            {statusLabel}
            <IconChevronDown size={14} />
          </StyledChip>
          {isStatusOpen && (
            <>
              <StyledBackdrop onClick={() => setIsStatusOpen(false)} />
              <StyledPopover>
                {statusOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(option.value)}
                      onChange={() => toggleStatus(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </StyledPopover>
            </>
          )}
        </StyledPopoverAnchor>
      )}

      <StyledSelect
        aria-label={t`Last contacted`}
        data-active={filters.lastContact !== 'any'}
        value={filters.lastContact}
        onChange={(event) =>
          update({ lastContact: event.target.value as PulseLastContactFilter })
        }
      >
        <option value="any">{t`Last touch: any`}</option>
        <option value="within7">{t`Touched in last 7 days`}</option>
        <option value="olderThan3">{t`No touch in 3+ days`}</option>
        <option value="olderThan7">{t`No touch in 7+ days`}</option>
        <option value="olderThan14">{t`No touch in 14+ days`}</option>
        <option value="olderThan30">{t`No touch in 30+ days`}</option>
        <option value="never">{t`Never touched`}</option>
      </StyledSelect>

      <StyledSelect
        aria-label={t`Calls`}
        data-active={filters.calls !== 'any'}
        value={filters.calls}
        onChange={(event) =>
          update({
            calls: event.target.value as PulseSmartViewFilters['calls'],
          })
        }
      >
        <option value="any">{t`Calls: any`}</option>
        <option value="never">{t`Never called`}</option>
        <option value="called">{t`Called before`}</option>
      </StyledSelect>

      <StyledSelect
        aria-label={t`Tasks`}
        data-active={filters.tasks !== 'any'}
        value={filters.tasks}
        onChange={(event) =>
          update({
            tasks: event.target.value as PulseSmartViewFilters['tasks'],
          })
        }
      >
        <option value="any">{t`Tasks: any`}</option>
        <option value="overdue">{t`Overdue follow-up`}</option>
        <option value="open">{t`Has open tasks`}</option>
        <option value="none">{t`No open tasks`}</option>
      </StyledSelect>

      <StyledSelect
        aria-label={t`Deals`}
        data-active={filters.deals !== 'any'}
        value={filters.deals}
        onChange={(event) =>
          update({
            deals: event.target.value as PulseSmartViewFilters['deals'],
          })
        }
      >
        <option value="any">{t`Deals: any`}</option>
        <option value="with">{t`Has deals`}</option>
        <option value="without">{t`No deals`}</option>
      </StyledSelect>

      <StyledSelect
        aria-label={t`Owner`}
        data-active={filters.owner !== 'any'}
        value={filters.owner}
        onChange={(event) =>
          update({
            owner: event.target.value as PulseSmartViewFilters['owner'],
          })
        }
      >
        <option value="any">{t`Owner: anyone`}</option>
        <option value="me">{t`My leads`}</option>
        <option value="unassigned">{t`Unassigned`}</option>
      </StyledSelect>

      <StyledChip
        type="button"
        aria-pressed={filters.hasPhone}
        onClick={() => update({ hasPhone: !filters.hasPhone })}
      >
        {t`Has phone`}
      </StyledChip>
      <StyledChip
        type="button"
        aria-pressed={filters.hasEmail}
        onClick={() => update({ hasEmail: !filters.hasEmail })}
      >
        {t`Has email`}
      </StyledChip>

      {hasChanges && (
        <StyledClear type="button" onClick={onClear}>
          {t`Reset`}
        </StyledClear>
      )}
    </StyledBar>
  );
};
