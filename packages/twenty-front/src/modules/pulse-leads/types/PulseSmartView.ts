export type PulseLastContactFilter =
  | 'any'
  | 'never'
  | 'olderThan3'
  | 'olderThan7'
  | 'olderThan14'
  | 'olderThan30'
  | 'within7';

export type PulseSmartViewFilters = {
  search: string;
  statuses: string[];
  lastContact: PulseLastContactFilter;
  calls: 'any' | 'never' | 'called';
  deals: 'any' | 'with' | 'without';
  tasks: 'any' | 'open' | 'overdue' | 'none';
  owner: 'any' | 'me' | 'unassigned';
  hasPhone: boolean;
  hasEmail: boolean;
};

export type PulseSortField =
  | 'name'
  | 'lastActivityAt'
  | 'lastCallAt'
  | 'callCount'
  | 'nextTaskAt'
  | 'dealValueMicros'
  | 'createdAt';

export type PulseSmartView = {
  id: string;
  name: string;
  filters: PulseSmartViewFilters;
  sort: { field: PulseSortField; direction: 'asc' | 'desc' };
  isBuiltIn?: boolean;
};
