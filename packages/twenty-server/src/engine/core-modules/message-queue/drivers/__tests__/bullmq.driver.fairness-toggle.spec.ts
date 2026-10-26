import {
  buildLabels,
  createFairnessHarness,
  silenceDriverLogs,
} from 'src/engine/core-modules/message-queue/drivers/__tests__/fairness-harness.test-util';

describe('BullMQDriver fairness toggle', () => {
  beforeAll(silenceDriverLogs);

  describe('S12: A has 3 jobs waiting when IS_WORKER_FAIRNESS_ENABLED changes, then B enqueues 2 jobs', () => {
    it('turned on: the backlog keeps its static priorities and runs first, in FIFO order', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: false });

      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'A', count: 3 }),
        workspaceId: 'A',
      });
      harness.setFairnessEnabled(true);
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'B', count: 2 }),
        workspaceId: 'B',
      });

      expect(await harness.processAll()).toEqual([
        'A1',
        'A2',
        'A3',
        'B1',
        'B2',
      ]);
    });

    it('turned off: the new jobs take the static priority and run before the tagged backlog', async () => {
      const harness = await createFairnessHarness({ isFairnessEnabled: true });

      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'A', count: 3 }),
        workspaceId: 'A',
      });
      harness.setFairnessEnabled(false);
      await harness.enqueueMany({
        labels: buildLabels({ prefix: 'B', count: 2 }),
        workspaceId: 'B',
      });

      expect(await harness.processAll()).toEqual([
        'B1',
        'B2',
        'A1',
        'A2',
        'A3',
      ]);
    });
  });
});
