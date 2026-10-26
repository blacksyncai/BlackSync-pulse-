import { Logger } from '@nestjs/common';

import { type RedisClient } from 'bullmq';

import { FAIR_TAG_SCRIPT } from 'src/engine/core-modules/message-queue/drivers/fairness/fair-tag-script.constant';
import { RESET_FAIR_EPOCH_SCRIPT } from 'src/engine/core-modules/message-queue/drivers/fairness/reset-fair-epoch-script.constant';
import { type MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';

const FAIR_CLOCK_TTL_MS = 24 * 60 * 60 * 1000;

export type FairTagReservation = { tag: number; weight: number };
const VIRTUAL_TIME_MEMBER = 'v';

export class FairPriorityTagger {
  private readonly logger = new Logger(FairPriorityTagger.name);

  constructor(
    private readonly getClient: (
      queueName: MessageQueue,
    ) => Promise<RedisClient>,
    private readonly keyPrefix: string,
  ) {}

  async tag({
    queueName,
    groupKeys,
    batchSize,
  }: {
    queueName: MessageQueue;
    groupKeys: string[];
    batchSize: number;
  }): Promise<FairTagReservation | undefined> {
    try {
      const client = await this.getClient(queueName);
      const keys = [
        this.buildKey({ queueName, suffix: 'epoch' }),
        this.buildKey({ queueName, suffix: 'vtime' }),
        this.buildKey({ queueName, suffix: 'weights' }),
        ...groupKeys.map((groupKey) =>
          this.buildKey({ queueName, suffix: `clock:${groupKey}` }),
        ),
      ];

      const reply: unknown = await client.runCommand('eval', [
        FAIR_TAG_SCRIPT,
        keys.length,
        ...keys,
        batchSize,
        FAIR_CLOCK_TTL_MS,
        ...groupKeys,
      ]);
      const [rawTag, rawWeight] = Array.isArray(reply) ? reply : [];
      const tag = Number(rawTag);
      const weight = Number(rawWeight);

      if (!Number.isFinite(tag) || !Number.isFinite(weight) || weight <= 0) {
        this.warn({ queueName, action: 'parse the fair tag', error: reply });

        return undefined;
      }

      return { tag, weight };
    } catch (error) {
      this.warn({ queueName, action: 'compute the fair tag', error });

      return undefined;
    }
  }

  async dispatched({
    queueName,
    tag,
  }: {
    queueName: MessageQueue;
    tag: number;
  }): Promise<void> {
    try {
      const client = await this.getClient(queueName);

      await client.runCommand('zadd', [
        this.buildKey({ queueName, suffix: 'vtime' }),
        'GT',
        tag,
        VIRTUAL_TIME_MEMBER,
      ]);
    } catch (error) {
      this.warn({ queueName, action: 'record the fair dispatch', error });
    }
  }

  async resetEpoch(queueName: MessageQueue): Promise<void> {
    try {
      const client = await this.getClient(queueName);

      await client.runCommand('eval', [
        RESET_FAIR_EPOCH_SCRIPT,
        2,
        this.buildKey({ queueName, suffix: 'epoch' }),
        this.buildKey({ queueName, suffix: 'vtime' }),
      ]);
    } catch (error) {
      this.warn({ queueName, action: 'reset the fairness epoch', error });
    }
  }

  private warn({
    queueName,
    action,
    error,
  }: {
    queueName: MessageQueue;
    action: string;
    error: unknown;
  }): void {
    this.logger.warn(
      `Failed to ${action} on queue ${queueName}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  private buildKey({
    queueName,
    suffix,
  }: {
    queueName: MessageQueue;
    suffix: string;
  }): string {
    return `${this.keyPrefix}:${queueName}:fair:${suffix}`;
  }
}
