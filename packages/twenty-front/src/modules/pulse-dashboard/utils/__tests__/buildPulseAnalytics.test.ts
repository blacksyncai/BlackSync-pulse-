import {
  buildPulseAnalytics,
  type AnalyticsOpportunity,
} from '../buildPulseAnalytics';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
const now = new Date(2026, 10, 8, 12);
const pipelines: PulsePipeline[] = [
  {
    viewId: 'sales',
    name: 'SMB',
    isDefault: false,
    pipelineValue: 'SMB',
    stageFieldName: 'salesStage',
    stages: [
      { value: 'NEW', label: 'New', color: 'blue' },
      { value: 'QUALIFIED', label: 'Qualified', color: 'blue' },
      { value: 'WON_EXPANDED', label: 'Won - Expanded', color: 'green' },
      { value: 'LOST', label: 'Lost / Nurture', color: 'red' },
    ],
  },
];
const deal = (
  id: string,
  fields: Partial<AnalyticsOpportunity> = {},
): AnalyticsOpportunity => ({
  id,
  name: id,
  pipeline: 'SMB',
  salesStage: 'NEW',
  createdAt: new Date(2026, 10, 1).toISOString(),
  closeDate: new Date(2026, 10, 5).toISOString(),
  amount: { amountMicros: 100_000_000, currencyCode: 'USD' },
  company: { name: 'Acme' },
  ...fields,
});
describe('sales dashboard analytics', () => {
  it('counts configured custom won/lost stages and excludes lost value from open pipeline', () => {
    const data = buildPulseAnalytics(
      [
        deal('open'),
        deal('won', { salesStage: 'WON_EXPANDED' }),
        deal('lost', { salesStage: 'LOST' }),
      ],
      pipelines,
      'USD',
      now,
    );
    expect(data).toMatchObject({
      openCount: 1,
      openPipeline: 100,
      wonCount: 1,
      lostCount: 1,
      wonThisMonthCount: 1,
    });
    expect(data.stages.reduce((total, stage) => total + stage.count, 0)).toBe(
      3,
    );
  });
  it('never combines currencies', () =>
    expect(
      buildPulseAnalytics(
        [
          deal('usd'),
          deal('eur', {
            amount: { amountMicros: 900_000_000, currencyCode: 'EUR' },
          }),
        ],
        pipelines,
        'USD',
        now,
      ).openPipeline,
    ).toBe(100));
  it('does not invent close dates from creation dates or count future closes', () => {
    const data = buildPulseAnalytics(
      [
        deal('missing', { salesStage: 'WON_EXPANDED', closeDate: null }),
        deal('future', {
          salesStage: 'WON_EXPANDED',
          closeDate: new Date(2026, 10, 30).toISOString(),
        }),
      ],
      pipelines,
      'USD',
      now,
    );
    expect(data.wonCount).toBe(2);
    expect(data.wonThisMonthCount).toBe(0);
    expect(data.activity.won.every((value) => value === 0)).toBe(true);
  });
  it('groups creation-month cohorts instead of fabricating old pipeline snapshots', () => {
    const data = buildPulseAnalytics(
      [deal('old', { createdAt: new Date(2026, 9, 1).toISOString() })],
      pipelines,
      'USD',
      now,
    );
    expect(data.pipelineHistory[10].early).toBe(100);
    expect(data.pipelineHistory[11].early).toBe(0);
  });
  it('supports a selected pipeline with a custom stage field and no pipeline filter value', () => {
    const data = buildPulseAnalytics(
      [deal('won', { salesStage: 'WON_EXPANDED' })],
      [{ ...pipelines[0], pipelineValue: null }],
      'USD',
      now,
    );
    expect(data.wonCount).toBe(1);
  });
  it('handles empty and missing-stage records without dropping deals', () => {
    expect(buildPulseAnalytics([], pipelines, 'USD', now)).toMatchObject({
      wonCount: 0,
      openCount: 0,
      lostCount: 0,
      topDeals: [],
    });
    const data = buildPulseAnalytics(
      [deal('no stage', { salesStage: null })],
      pipelines,
      'USD',
      now,
    );
    expect(
      data.stages.find((stage) => stage.label === 'Unassigned')?.count,
    ).toBe(1);
  });
});
