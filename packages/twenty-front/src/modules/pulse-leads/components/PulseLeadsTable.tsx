import { PulseLeadLogo } from '@/pulse-leads/components/PulseLeadLogo';
import { PulseLeadStatusSelect } from '@/pulse-leads/components/PulseLeadStatusSelect';
import { type LeadStatusOption } from '@/pulse-leads/hooks/useLeadStatusOptions';
import { type PulseLead } from '@/pulse-leads/types/PulseLead';
import {
  type PulseSmartView,
  type PulseSortField,
} from '@/pulse-leads/types/PulseSmartView';
import {
  formatCompactMoney,
  formatRelativeTime,
} from '@/pulse-leads/utils/formatRelativeTime';
import { usePulseContactActions } from '@/pulse-record/hooks/usePulseContactActions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  IconArrowDown,
  IconArrowUp,
  IconMail,
  IconPhone,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const PAGE_SIZE = 200;
const GRID_COLUMNS =
  '36px minmax(220px, 2.2fr) 150px minmax(180px, 1.6fr) 110px 110px 70px 130px 110px';

const StyledTable = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  min-width: 1100px;
  overflow: hidden;
`;

const StyledRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  cursor: pointer;
  display: grid;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${GRID_COLUMNS};
  min-height: 52px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  &[data-selected='true'] {
    background: ${themeCssVariables.accent.quaternary};
  }

  &:hover [data-row-action] {
    opacity: 1;
  }
`;

const StyledHeader = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.tertiary};
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: ${GRID_COLUMNS};
  height: 38px;
  padding: 0 ${themeCssVariables.spacing[3]};
  position: sticky;
  top: 0;
  z-index: 2;
`;

const StyledSortButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  gap: 2px;
  padding: 0;
  text-align: left;

  &[data-active='true'] {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledLeadCell = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
`;

const StyledStack = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const StyledPrimary = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSecondary = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-tone='danger'] {
    color: ${themeCssVariables.font.color.danger};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledContactCell = styled.div`
  align-items: center;
  display: flex;
  gap: 4px;
  min-width: 0;
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
  opacity: 0.6;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.accent.accent10};
    opacity: 1;
  }
`;

const StyledFooter = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  justify-content: center;
  padding: ${themeCssVariables.spacing[3]};

  button {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.accent.accent10};
    cursor: pointer;
    font: inherit;
  }
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[10]};
  text-align: center;
`;

type PulseLeadsTableProps = {
  leads: PulseLead[];
  now: number;
  sort: PulseSmartView['sort'];
  onSortChange: (sort: PulseSmartView['sort']) => void;
  statusOptions: LeadStatusOption[];
  onStatusChange: (leadId: string, status: string | null) => void;
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onOpenLead: (leadId: string) => void;
  isLoading: boolean;
};

export const PulseLeadsTable = ({
  leads,
  now,
  sort,
  onSortChange,
  statusOptions,
  onStatusChange,
  selectedIds,
  onSelectionChange,
  onOpenLead,
  isLoading,
}: PulseLeadsTableProps) => {
  const { t } = useLingui();
  const { call, email } = usePulseContactActions();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleLeads = leads.slice(0, visibleCount);
  const isAllSelected =
    leads.length > 0 && leads.every((lead) => selectedIds.has(lead.id));

  const toggleAll = () =>
    onSelectionChange(
      isAllSelected ? new Set() : new Set(leads.map((lead) => lead.id)),
    );

  const toggleOne = (leadId: string) => {
    const next = new Set(selectedIds);

    if (next.has(leadId)) {
      next.delete(leadId);
    } else {
      next.add(leadId);
    }

    onSelectionChange(next);
  };

  const sortHeader = (field: PulseSortField, label: string) => {
    const isActive = sort.field === field;

    return (
      <StyledSortButton
        type="button"
        data-active={isActive}
        onClick={() =>
          onSortChange({
            field,
            direction: isActive && sort.direction === 'desc' ? 'asc' : 'desc',
          })
        }
      >
        {label}
        {isActive &&
          (sort.direction === 'desc' ? (
            <IconArrowDown size={12} />
          ) : (
            <IconArrowUp size={12} />
          ))}
      </StyledSortButton>
    );
  };

  return (
    <StyledTable>
      <StyledHeader>
        <input
          type="checkbox"
          aria-label={t`Select all leads`}
          checked={isAllSelected}
          onChange={toggleAll}
        />
        {sortHeader('name', t`Lead`)}
        <span>{t`Status`}</span>
        <span>{t`Contact`}</span>
        {sortHeader('lastActivityAt', t`Last touch`)}
        {sortHeader('lastCallAt', t`Last call`)}
        {sortHeader('callCount', t`Calls`)}
        {sortHeader('nextTaskAt', t`Next task`)}
        {sortHeader('dealValueMicros', t`Deals`)}
      </StyledHeader>

      {leads.length === 0 && (
        <StyledEmpty>
          {isLoading ? t`Loading leads...` : t`No leads match this view.`}
        </StyledEmpty>
      )}

      {visibleLeads.map((lead) => {
        const contact = lead.primaryContact;
        const contactName = [contact?.firstName, contact?.lastName]
          .filter(Boolean)
          .join(' ');
        const isOverdue =
          isDefined(lead.nextTaskAt) &&
          new Date(lead.nextTaskAt).getTime() < now;

        return (
          <StyledRow
            key={lead.id}
            data-selected={selectedIds.has(lead.id)}
            onClick={() => onOpenLead(lead.id)}
          >
            <input
              type="checkbox"
              aria-label={t`Select ${lead.name ?? ''}`}
              checked={selectedIds.has(lead.id)}
              onClick={(event) => event.stopPropagation()}
              onChange={() => toggleOne(lead.id)}
            />
            <StyledLeadCell>
              <PulseLeadLogo name={lead.name} domain={lead.domain} />
              <StyledStack>
                <StyledPrimary>{lead.name ?? t`Untitled lead`}</StyledPrimary>
                {isDefined(lead.domain) && (
                  <StyledSecondary>
                    {lead.domain.replace(/^https?:\/\/(www\.)?/, '')}
                  </StyledSecondary>
                )}
              </StyledStack>
            </StyledLeadCell>
            <div>
              {statusOptions.length > 0 && (
                <PulseLeadStatusSelect
                  value={lead.leadStatus}
                  options={statusOptions}
                  onChange={(status) => onStatusChange(lead.id, status)}
                />
              )}
            </div>
            <StyledContactCell>
              <StyledStack style={{ flex: 1 }}>
                <StyledPrimary>
                  {contactName.length > 0 ? contactName : '—'}
                </StyledPrimary>
                {lead.contactCount > 1 && (
                  <StyledSecondary>
                    {t`+${lead.contactCount - 1} more`}
                  </StyledSecondary>
                )}
              </StyledStack>
              {isDefined(contact?.phone) && (
                <StyledIconButton
                  type="button"
                  aria-label={t`Call ${contactName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void call(contact.phone, {
                      personId: contact.id,
                      companyId: lead.id,
                    });
                  }}
                >
                  <IconPhone size={16} />
                </StyledIconButton>
              )}
              {isDefined(contact?.email) && (
                <StyledIconButton
                  type="button"
                  aria-label={t`Email ${contactName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    email(contact.email);
                  }}
                >
                  <IconMail size={16} />
                </StyledIconButton>
              )}
            </StyledContactCell>
            <StyledSecondary>
              {formatRelativeTime(lead.lastActivityAt, now) ?? t`Never`}
            </StyledSecondary>
            <StyledSecondary>
              {formatRelativeTime(lead.lastCallAt, now) ?? '—'}
            </StyledSecondary>
            <StyledSecondary>{lead.callCount}</StyledSecondary>
            <StyledSecondary data-tone={isOverdue ? 'danger' : undefined}>
              {isDefined(lead.nextTaskAt)
                ? isOverdue
                  ? t`Overdue ${formatRelativeTime(lead.nextTaskAt, now)}`
                  : formatRelativeTime(lead.nextTaskAt, now)
                : '—'}
            </StyledSecondary>
            <StyledSecondary>
              {lead.dealCount === 0
                ? '—'
                : lead.dealValueMicros > 0
                  ? formatCompactMoney(lead.dealValueMicros)
                  : lead.dealCount === 1
                    ? t`1 deal`
                    : t`${lead.dealCount} deals`}
            </StyledSecondary>
          </StyledRow>
        );
      })}

      {leads.length > visibleCount && (
        <StyledFooter>
          <button
            type="button"
            onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
          >
            {t`Show ${Math.min(PAGE_SIZE, leads.length - visibleCount)} more of ${leads.length - visibleCount}`}
          </button>
        </StyledFooter>
      )}
    </StyledTable>
  );
};
