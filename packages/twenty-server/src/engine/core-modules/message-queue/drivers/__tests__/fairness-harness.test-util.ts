import { Logger } from '@nestjs/common';

import { type Job } from 'bullmq';
import { type Redis } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { isDefined } from 'twenty-shared/utils';

import { BullMQDriver } from 'src/engine/core-modules/message-queue/drivers/bullmq.driver';
import { type QueueJobOptions } from 'src/engine/core-modules/message-queue/drivers/interfaces/job-options.interface';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

export type ScenarioJobData = { label: string; workspaceId?: string };

type StoredJobOptions = {
  jobId?: string;
  priority?: number;
  fairTag?: number;
  delay?: number;
  attempts?: number;
  backoff?: { type: string; delay: number };
};

type StoredJob = {
  id: string;
  name: string;
  data: ScenarioJobData;
  options: StoredJobOptions;
  timestamp: number;
  insertionIndex: number;
  attemptsMade: number;
  isPromoted: boolean;
};

type JobToStore = {
  id?: string;
  name: string;
  data: ScenarioJobData;
  options: StoredJobOptions;
  attemptsMade?: number;
};

type SchedulerTemplate = {
  name: string;
  data: ScenarioJobData;
  options: StoredJobOptions;
};

type RedisClientDouble = {
  runCommand: (name: string, args: (string | number)[]) => Promise<unknown>;
};

type BullMQDouble = {
  now: number;
  jobs: StoredJob[];
  schedulers: SchedulerTemplate[];
  nextInsertionIndex: number;
  processor: ((job: Job) => Promise<void>) | undefined;
  listeners: Record<string, () => void>;
  client: RedisClientDouble | undefined;
  store: (jobToStore: JobToStore) => { id: string };
  takeNext: () => StoredJob | undefined;
  reset: (client: RedisClientDouble) => void;
};

const mockBullMQ: BullMQDouble = {
  now: 0,
  jobs: [],
  schedulers: [],
  nextInsertionIndex: 0,
  processor: undefined,
  listeners: {},
  client: undefined,
  store: ({ id, name, data, options, attemptsMade = 0 }) => {
    const job: StoredJob = {
      id: id ?? options.jobId ?? `job-${mockBullMQ.nextInsertionIndex}`,
      name,
      data,
      options,
      timestamp: mockBullMQ.now,
      insertionIndex: mockBullMQ.nextInsertionIndex,
      attemptsMade,
      isPromoted: (options.delay ?? 0) === 0,
    };

    mockBullMQ.nextInsertionIndex += 1;
    mockBullMQ.jobs.push(job);

    return { id: job.id };
  },
  // Lowest priority first, insertion order on ties, a promoted job joins the end of its level
  takeNext: () => {
    const eligibleJobs = mockBullMQ.jobs.filter(
      (job) => job.timestamp + (job.options.delay ?? 0) <= mockBullMQ.now,
    );

    for (const job of eligibleJobs) {
      if (!job.isPromoted) {
        job.isPromoted = true;
        job.insertionIndex = mockBullMQ.nextInsertionIndex;
        mockBullMQ.nextInsertionIndex += 1;
      }
    }

    const [next] = [...eligibleJobs].sort(
      (left, right) =>
        (left.options.priority ?? 0) - (right.options.priority ?? 0) ||
        left.insertionIndex - right.insertionIndex,
    );

    if (!isDefined(next)) {
      return undefined;
    }

    mockBullMQ.jobs = mockBullMQ.jobs.filter((job) => job !== next);

    return next;
  },
  reset: (client) => {
    mockBullMQ.now = Date.now();
    mockBullMQ.jobs = [];
    mockBullMQ.schedulers = [];
    mockBullMQ.nextInsertionIndex = 0;
    mockBullMQ.processor = undefined;
    mockBullMQ.listeners = {};
    mockBullMQ.client = client;
  },
};

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    get client() {
      return Promise.resolve(mockBullMQ.client);
    },
    add: async (
      name: string,
      data: ScenarioJobData,
      options: StoredJobOptions,
    ) => mockBullMQ.store({ name, data, options }),
    addBulk: async (
      jobs: { name: string; data: ScenarioJobData; opts: StoredJobOptions }[],
    ) =>
      jobs.map(({ name, data, opts }) =>
        mockBullMQ.store({ name, data, options: opts }),
      ),
    getRanges: async () => mockBullMQ.jobs.map((job) => job.id),
    upsertJobScheduler: async (
      _schedulerId: string,
      _repeat: unknown,
      template: { name: string; data: ScenarioJobData; opts: StoredJobOptions },
    ) => {
      mockBullMQ.schedulers.push({
        name: template.name,
        data: template.data,
        options: template.opts,
      });
    },
    setGlobalConcurrency: async () => undefined,
    removeGlobalConcurrency: async () => undefined,
  })),
  Worker: jest
    .fn()
    .mockImplementation(
      (_queueName: string, processor: (job: Job) => Promise<void>) => {
        mockBullMQ.processor = processor;

        return {
          on: (event: string, listener: () => void) => {
            mockBullMQ.listeners[event] = listener;
          },
        };
      },
    ),
  MetricsTime: { ONE_WEEK: 1 },
}));

const QUEUE = MessageQueue.logicFunctionQueue;
const KEY_PREFIX = 'bull';
const JOB_NAME = 'scenario-job';
const FAIRNESS_FLAG = 'IS_WORKER_FAIRNESS_ENABLED';
const VIRTUAL_TIME_KEY = `${KEY_PREFIX}:${QUEUE}:fair:vtime`;

const flushAsyncWork = async () => {
  for (let round = 0; round < 10; round += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

export const silenceDriverLogs = () => {
  jest.useRealTimers();
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
};

export const buildLabels = ({
  prefix,
  count,
  from = 1,
}: {
  prefix: string;
  count: number;
  from?: number;
}) => Array.from({ length: count }, (_, index) => `${prefix}${from + index}`);

const createRedisClientDouble = (redis: Redis): RedisClientDouble => ({
  runCommand: async (name, args) => {
    if (name === 'eval') {
      const [script, numberOfKeys, ...scriptArguments] = args;

      return redis.eval(
        String(script),
        Number(numberOfKeys),
        ...scriptArguments,
      );
    }

    // ioredis-mock has no ZADD GT, the only ZADD the driver issues
    if (name === 'zadd') {
      const [key, , score, member] = args;
      const currentScore = await redis.zscore(String(key), String(member));

      if (!isDefined(currentScore) || Number(score) > Number(currentScore)) {
        await redis.zadd(String(key), Number(score), String(member));
      }

      return undefined;
    }

    throw new Error(`Unexpected Redis command ${name}`);
  },
});

type EnqueueInput = { label: string; workspaceId?: string } & Pick<
  QueueJobOptions,
  'groupKeys' | 'priority' | 'delay' | 'id' | 'retryLimit' | 'backoff'
>;

export const createFairnessHarness = async ({
  isFairnessEnabled: initialFairnessEnabled,
}: {
  isFairnessEnabled: boolean;
}) => {
  const redis = new RedisMock();

  await redis.flushall();
  mockBullMQ.reset(createRedisClientDouble(redis));

  let isFairnessEnabled = initialFairnessEnabled;
  const metricsService = {
    recordHistogram: jest.fn(),
    incrementCounterForEvent: jest.fn().mockResolvedValue(undefined),
  };
  const driver = new BullMQDriver(
    { prefix: KEY_PREFIX, connection: {} },
    metricsService as never,
    {
      get: (key: string) =>
        key === FAIRNESS_FLAG ? isFairnessEnabled : undefined,
    } as never,
    { emit: jest.fn() } as never,
  );

  driver.register(QUEUE);

  const processedLabels: string[] = [];
  const remainingFailures = new Map<string, number>();

  driver.work<ScenarioJobData>(QUEUE, async ({ data }) => {
    processedLabels.push(data.label);

    const failures = remainingFailures.get(data.label) ?? 0;

    if (failures > 0) {
      remainingFailures.set(data.label, failures - 1);
      throw new Error(`${data.label} failed`);
    }
  });
  await flushAsyncWork();

  const processOne = async (): Promise<boolean> => {
    const job = mockBullMQ.takeNext();

    if (!isDefined(job) || !isDefined(mockBullMQ.processor)) {
      return false;
    }

    try {
      await mockBullMQ.processor({
        ...job,
        opts: job.options,
        attemptsStarted: job.attemptsMade + 1,
        updateData: jest.fn(),
        updateProgress: jest.fn(),
      } as unknown as Job);
    } catch {
      // BullMQ re-adds a failed job with its options for the next attempt
      if (job.attemptsMade + 1 < (job.options.attempts ?? 1)) {
        mockBullMQ.store({
          id: job.id,
          name: job.name,
          data: job.data,
          options: { ...job.options, delay: job.options.backoff?.delay ?? 0 },
          attemptsMade: job.attemptsMade + 1,
        });
      }
    }
    await flushAsyncWork();

    return true;
  };

  const enqueue = async ({ label, workspaceId, ...options }: EnqueueInput) => {
    await driver.add<ScenarioJobData>(
      QUEUE,
      JOB_NAME,
      { label, workspaceId },
      options,
    );
  };

  return {
    metricsService,
    enqueue,
    enqueueMany: async ({
      labels,
      ...options
    }: { labels: string[] } & Omit<EnqueueInput, 'label'>) => {
      for (const label of labels) {
        await enqueue({ label, ...options });
      }
    },
    enqueueBulk: async ({
      labels,
      workspaceId,
      groupKeys,
    }: {
      labels: string[];
      workspaceId: string;
      groupKeys?: string[];
    }) => {
      await driver.bulkAdd<ScenarioJobData>(
        QUEUE,
        JOB_NAME,
        labels.map((label) => ({ data: { label, workspaceId } })),
        isDefined(groupKeys) ? { groupKeys } : undefined,
      );
    },
    scheduleCron: async ({
      label,
      every,
    }: {
      label: string;
      every: number;
    }) => {
      await driver.addCron<ScenarioJobData>({
        queueName: QUEUE,
        jobName: JOB_NAME,
        data: { label },
        options: { repeat: { every } },
      });
    },
    fireCrons: () => {
      for (const scheduler of mockBullMQ.schedulers) {
        mockBullMQ.store(scheduler);
      }
    },
    processNext: async (count: number) => {
      const alreadyProcessed = processedLabels.length;

      for (let index = 0; index < count; index += 1) {
        if (!(await processOne())) {
          break;
        }
      }

      return processedLabels.slice(alreadyProcessed);
    },
    processAll: async () => {
      const alreadyProcessed = processedLabels.length;
      let hasProcessedJob = await processOne();

      while (hasProcessedJob) {
        hasProcessedJob = await processOne();
      }

      mockBullMQ.listeners.drained?.();
      await flushAsyncWork();

      return processedLabels.slice(alreadyProcessed);
    },
    advanceTime: ({ milliseconds }: { milliseconds: number }) => {
      mockBullMQ.now += milliseconds;
    },
    setFairnessEnabled: (value: boolean) => {
      isFairnessEnabled = value;
    },
    failNextAttempts: ({ label, count }: { label: string; count: number }) => {
      remainingFailures.set(label, count);
    },
    setWeight: async ({
      groupKey,
      weight,
    }: {
      groupKey: string;
      weight: number;
    }) => {
      await redis.hset(`${KEY_PREFIX}:${QUEUE}:fair:weights`, groupKey, weight);
    },
    setVirtualTime: async ({ value }: { value: number }) => {
      await redis.zadd(VIRTUAL_TIME_KEY, value, 'v');
    },
    readVirtualTime: async () => {
      const score = await redis.zscore(VIRTUAL_TIME_KEY, 'v');

      return isDefined(score) ? Number(score) : 0;
    },
    readClock: async ({ groupKey }: { groupKey: string }) => {
      const clock = await redis.get(
        `${KEY_PREFIX}:${QUEUE}:fair:clock:${groupKey}`,
      );

      return isDefined(clock) ? Number(clock.split(':')[1]) : undefined;
    },
    readFairTag: ({ label }: { label: string }) =>
      mockBullMQ.jobs.find((job) => job.data.label === label)?.options.fairTag,
    breakRedis: () => {
      const runCommand = jest
        .fn()
        .mockRejectedValue(new Error('Redis connection lost'));

      mockBullMQ.client = { runCommand };

      return runCommand;
    },
  };
};

export type FairnessHarness = Awaited<ReturnType<typeof createFairnessHarness>>;
