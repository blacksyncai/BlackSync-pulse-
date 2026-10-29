import { type PulseLead } from '@/pulse-leads/types/PulseLead';
import {
  type PulseLastContactFilter,
  type PulseSmartView,
  type PulseSmartViewFilters,
} from '@/pulse-leads/types/PulseSmartView';

const DAY_MS = 24 * 60 * 60 * 1000;

const OLDER_THAN_DAYS: Partial<Record<PulseLastContactFilter, number>> = {
  olderThan3: 3,
  olderThan7: 7,
  olderThan14: 14,
  olderThan30: 30,
};

const toTime = (value: string | null) =>
  value === null ? null : new Date(value).getTime();

const matchesLastContact = (
  lead: PulseLead,
  filter: PulseLastContactFilter,
  now: number,
) => {
  const lastActivity = toTime(lead.lastActivityAt);

  if (filter === 'any') {
    return true;
  }

  if (filter === 'never') {
    return lastActivity === null;
  }

  if (filter === 'within7') {
    return lastActivity !== null && now - lastActivity <= 7 * DAY_MS;
  }

  const days = OLDER_THAN_DAYS[filter] ?? 0;

  return lastActivity === null || now - lastActivity > days * DAY_MS;
};

export const matchesSmartViewFilters = (
  lead: PulseLead,
  filters: PulseSmartViewFilters,
  {
    now,
    currentWorkspaceMemberId,
  }: { now: number; currentWorkspaceMemberId: string | null },
) => {
  const search = filters.search.trim().toLowerCase();

  if (search.length > 0) {
    const contact = lead.primaryContact;
    const haystack = [
      lead.name,
      lead.domain,
      contact?.firstName,
      contact?.lastName,
      contact?.email,
      contact?.phone,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(search)) {
      return false;
    }
  }

  if (
    filters.statuses.length > 0 &&
    !filters.statuses.includes(lead.leadStatus ?? '')
  ) {
    return false;
  }

  if (!matchesLastContact(lead, filters.lastContact, now)) {
    return false;
  }

  if (filters.calls === 'never' && lead.callCount > 0) {
    return false;
  }

  if (filters.calls === 'called' && lead.callCount === 0) {
    return false;
  }

  if (filters.deals === 'with' && lead.dealCount === 0) {
    return false;
  }

  if (filters.deals === 'without' && lead.dealCount > 0) {
    return false;
  }

  const nextTask = toTime(lead.nextTaskAt);

  if (filters.tasks === 'open' && lead.openTaskCount === 0) {
    return false;
  }

  if (filters.tasks === 'none' && lead.openTaskCount > 0) {
    return false;
  }

  if (filters.tasks === 'overdue' && (nextTask === null || nextTask >= now)) {
    return false;
  }

  if (filters.owner === 'me' && lead.ownerId !== currentWorkspaceMemberId) {
    return false;
  }

  if (filters.owner === 'unassigned' && lead.ownerId !== null) {
    return false;
  }

  if (filters.hasPhone && !lead.primaryContact?.phone) {
    return false;
  }

  if (filters.hasEmail && !lead.primaryContact?.email) {
    return false;
  }

  return true;
};

const sortValue = (lead: PulseLead, field: PulseSmartView['sort']['field']) => {
  switch (field) {
    case 'name':
      return (lead.name ?? '').toLowerCase();
    case 'callCount':
      return lead.callCount;
    case 'dealValueMicros':
      return lead.dealValueMicros;
    default:
      return toTime(lead[field]);
  }
};

export const applySmartView = (
  leads: PulseLead[],
  view: Pick<PulseSmartView, 'filters' | 'sort'>,
  context: { now: number; currentWorkspaceMemberId: string | null },
) => {
  const direction = view.sort.direction === 'asc' ? 1 : -1;

  return leads
    .filter((lead) => matchesSmartViewFilters(lead, view.filters, context))
    .sort((left, right) => {
      const leftValue = sortValue(left, view.sort.field);
      const rightValue = sortValue(right, view.sort.field);

      // Empty values always sink to the bottom, whichever way the column is sorted.
      if (leftValue === null || rightValue === null) {
        return leftValue === rightValue ? 0 : leftValue === null ? 1 : -1;
      }

      return leftValue < rightValue
        ? -direction
        : leftValue > rightValue
          ? direction
          : 0;
    });
};
