import {
  buildLabels,
  createFairnessHarness,
  type FairnessHarness,
  silenceDriverLogs,
} from 'src/engine/core-modules/message-queue/drivers/__tests__/fairness-harness.test-util';
import { buildWorkspaceGroupKey } from 'src/engine/core-modules/message-queue/utils/build-workspace-group-key.util';
import { SERVER_ROUTE_DISPATCH_JOB_PRIORITY } from 'src/engine/core-modules/server-route-trigger/constants/server-route-dispatch-job-priority.constant';

const TIER_RANGE = 2 ** 19;

describe('BullMQDriver fairness mechanics', () => {
  beforeAll(silenceDriverLogs);

  describe('S13: A enqueues a job with id sync-A twice, the second one is a duplicate, then A enqueues 1 job and B enqueues 2 jobs', () => {
    const enqueue = async (harness: FairnessHarness) => {
      await harness.enqueue({ label: 'A1', workspaceId: 'A', id: 'sync-A' });
      await harness.enqueue({ label: 'A1', workspaceId: 'A', id: 'sync-A' });
      await harness.enqueue({ label: 'A2', workspaceId: 'A' });
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'B', count: 2 }),
        workspaceId: 'B',
      });
    };

    it('flag off: the duplicate is skipped, the rest is FIFO', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: false });

      await enqueue(harness);

      expect(await harness.processAll()).toEqual(['A1', 'A2', 'B1', 'B2']);
    });

    it('flag on: the duplicate neither runs nor advances the clock of A', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: true });

      await enqueue(harness);

      expect(
        await harness.readClock({ groupKey: buildWorkspaceGroupKey('A') }),
      ).toBe(2);
      expect(await harness.processAll()).toEqual(['A1', 'B1', 'A2', 'B2']);
    });
  });

  describe('S14: A enqueues a job that fails once and is retried, B enqueues 2 jobs', () => {
    const enqueue = async (harness: FairnessHarness) => {
      harness.failNextAttempts({ label: 'R', count: 1 });
      await harness.enqueue({ label: 'R', workspaceId: 'A', retryLimit: 1 });
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'B', count: 2 }),
        workspaceId: 'B',
      });
    };

    it('flag off: the retry re-enters the FIFO behind the waiting jobs', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: false });

      await enqueue(harness);

      expect(await harness.processNext(4)).toEqual(['R', 'B1', 'B2', 'R']);
    });

    it('flag on: the retry keeps its tag, comes back as soon as its turn does, and leaves the clocks untouched', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: true });

      await enqueue(harness);

      expect(await harness.processNext(4)).toEqual(['R', 'B1', 'R', 'B2']);
      expect(
        await harness.readClock({ groupKey: buildWorkspaceGroupKey('A') }),
      ).toBe(1);
      expect(await harness.readVirtualTime()).toBe(1);
    });
  });

  describe('S15: the virtual time has passed the 2^19 budget of a tier when A and B enqueue 3 jobs each and B sends a route dispatch', () => {
    const enqueue = async (harness: FairnessHarness) => {
      await harness.setVirtualTime({ value: TIER_RANGE + 10 });
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'A', count: 3 }),
        workspaceId: 'A',
      });
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'B', count: 3 }),
        workspaceId: 'B',
      });
      await harness.enqueue({
        label: 'R_B',
        workspaceId: 'B',
        priority: SERVER_ROUTE_DISPATCH_JOB_PRIORITY,
      });
    };
    const expectedOrder = [
      'R_B',
      ...buildLabels({ prefix: 'A', count: 3 }),
      ...buildLabels({ prefix: 'B', count: 3 }),
    ];

    it('flag off: FIFO within the tier, the route dispatch first', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: false });

      await enqueue(harness);

      expect(await harness.processAll()).toEqual(expectedOrder);
    });

    it('flag on: the saturated tier degrades to FIFO, the tiers still hold', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: true });

      await enqueue(harness);

      expect(await harness.processAll()).toEqual(expectedOrder);
    });
  });

  describe('S16: A has 3 tagged jobs waiting when a cron scheduler fires', () => {
    const prepare = async (harness: FairnessHarness) => {
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'A', count: 3 }),
        workspaceId: 'A',
      });
      await harness.scheduleCron({ label: 'CRON', every: 60_000 });
      harness.fireCrons();
    };
    const expectedOrder = ['CRON', ...buildLabels({ prefix: 'A', count: 3 })];

    it('flag off: the cron instance has no priority, BullMQ serves it before every prioritized job', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: false });

      await prepare(harness);

      expect(await harness.processAll()).toEqual(expectedOrder);
    });

    it('flag on: same order, cron instances carry neither tier nor tag and stay outside fairness', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: true });

      await prepare(harness);

      expect(await harness.processAll()).toEqual(expectedOrder);
    });
  });
});
