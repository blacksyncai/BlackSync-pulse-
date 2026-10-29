import {
  type PulseSmartView,
  type PulseSmartViewFilters,
} from '@/pulse-leads/types/PulseSmartView';

export const EMPTY_SMART_VIEW_FILTERS: PulseSmartViewFilters = {
  search: '',
  statuses: [],
  lastContact: 'any',
  calls: 'any',
  deals: 'any',
  tasks: 'any',
  owner: 'any',
  hasPhone: false,
  hasEmail: false,
};

export const DEFAULT_SMART_VIEWS: PulseSmartView[] = [
  {
    id: 'all',
    name: 'All leads',
    filters: EMPTY_SMART_VIEW_FILTERS,
    sort: { field: 'lastActivityAt', direction: 'desc' },
    isBuiltIn: true,
  },
  {
    id: 'never-called',
    name: 'Never called',
    filters: { ...EMPTY_SMART_VIEW_FILTERS, calls: 'never', hasPhone: true },
    sort: { field: 'createdAt', direction: 'desc' },
    isBuiltIn: true,
  },
  {
    id: 'gone-quiet',
    name: 'No touch in 7 days',
    filters: { ...EMPTY_SMART_VIEW_FILTERS, lastContact: 'olderThan7' },
    sort: { field: 'lastActivityAt', direction: 'asc' },
    isBuiltIn: true,
  },
  {
    id: 'overdue-tasks',
    name: 'Overdue follow-ups',
    filters: { ...EMPTY_SMART_VIEW_FILTERS, tasks: 'overdue' },
    sort: { field: 'nextTaskAt', direction: 'asc' },
    isBuiltIn: true,
  },
  {
    id: 'with-deals',
    name: 'Leads with deals',
    filters: { ...EMPTY_SMART_VIEW_FILTERS, deals: 'with' },
    sort: { field: 'dealValueMicros', direction: 'desc' },
    isBuiltIn: true,
  },
];
