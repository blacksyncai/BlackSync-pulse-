import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PULSE_SEQUENCE_CRON_PATTERN } from 'src/engine/core-modules/pulse-outreach/constants/pulse-sequence-cron-pattern.constant';
import { PulseSequenceService } from 'src/engine/core-modules/pulse-outreach/services/pulse-sequence.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Processor(MessageQueue.cronQueue)
export class PulseSequenceCronJob {
  private readonly logger = new Logger(PulseSequenceCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly pulseSequenceService: PulseSequenceService,
  ) {}

  @Process(PulseSequenceCronJob.name)
  @SentryCronMonitor(PulseSequenceCronJob.name, PULSE_SEQUENCE_CRON_PATTERN)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const workspace of workspaces) {
      await this.pulseSequenceService
        .processDueSteps(workspace.id)
        .catch((error) => {
          this.logger.error(
            `Cannot send sequence emails for workspace ${workspace.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
    }
  }
}
