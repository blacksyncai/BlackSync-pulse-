import { EMPTY_SMART_VIEW_FILTERS } from '@/pulse-leads/constants/DefaultSmartViews';
import { type PulseLead } from '@/pulse-leads/types/PulseLead';
import { applySmartView } from '@/pulse-leads/utils/applySmartView';

const now = new Date('2026-10-29T12:00:00Z').getTime();
const daysAgo = (days: number) => new Date(now - days * 86400000).toISOString();

const buildLead = (overrides: Partial<PulseLead>): PulseLead => ({
  id: overrides.name ?? 'lead',
  name: 'lead',
  domain: null,
  leadStatus: null,
  ownerId: null,
  createdAt: daysAgo(60),
  contactCount: 1,
  primaryContact: null,
  lastActivityAt: null,
  lastActivityTitle: null,
  lastCallAt: null,
  callCount: 0,
  nextTaskAt: null,
  openTaskCount: 0,
  dealCount: 0,
  dealValueMicros: 0,
  ...overrides,
});

const names = (leads: PulseLead[]) => leads.map((lead) => lead.name);
const context = { now, currentWorkspaceMemberId: 'me' };

describe('applySmartView', () => {
  const leads = [
    buildLead({
      name: 'Acme',
      leadStatus: 'INTERESTED',
      lastActivityAt: daysAgo(1),
      callCount: 2,
    }),
    buildLead({
      name: 'Bolt',
      leadStatus: 'POTENTIAL',
      lastActivityAt: daysAgo(20),
      ownerId: 'me',
    }),
    buildLead({
      name: 'Crane',
      primaryContact: {
        id: 'p',
        firstName: 'Ann',
        lastName: 'Lee',
        email: 'ann@crane.io',
        phone: '+1555',
      },
      nextTaskAt: daysAgo(2),
      openTaskCount: 1,
      dealCount: 1,
      dealValueMicros: 5_000_000_000,
    }),
  ];

  it('finds leads that went quiet, including never touched ones', () => {
    const result = applySmartView(
      leads,
      {
        filters: { ...EMPTY_SMART_VIEW_FILTERS, lastContact: 'olderThan7' },
        sort: { field: 'name', direction: 'asc' },
      },
      context,
    );

    expect(names(result)).toEqual(['Bolt', 'Crane']);
  });

  it('combines status, owner and call filters', () => {
    expect(
      names(
        applySmartView(
          leads,
          {
            filters: {
              ...EMPTY_SMART_VIEW_FILTERS,
              statuses: ['POTENTIAL', 'INTERESTED'],
              calls: 'never',
              owner: 'me',
            },
            sort: { field: 'name', direction: 'asc' },
          },
          context,
        ),
      ),
    ).toEqual(['Bolt']);
  });

  it('matches overdue follow-ups and searches contact details', () => {
    expect(
      names(
        applySmartView(
          leads,
          {
            filters: {
              ...EMPTY_SMART_VIEW_FILTERS,
              tasks: 'overdue',
              search: 'ann@',
            },
            sort: { field: 'name', direction: 'asc' },
          },
          context,
        ),
      ),
    ).toEqual(['Crane']);
  });

  it('keeps empty values last when sorting', () => {
    expect(
      names(
        applySmartView(
          leads,
          {
            filters: EMPTY_SMART_VIEW_FILTERS,
            sort: { field: 'lastActivityAt', direction: 'asc' },
          },
          context,
        ),
      ),
    ).toEqual(['Bolt', 'Acme', 'Crane']);
  });
});
