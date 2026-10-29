import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PULSE_TASK_REMINDER_CRON_PATTERN } from 'src/engine/core-modules/pulse-notifications/constants/pulse-task-reminder-cron-pattern.constant';
import { PulseTaskReminderService } from 'src/engine/core-modules/pulse-notifications/services/pulse-task-reminder.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

@Processor(MessageQueue.cronQueue)
export class PulseTaskReminderCronJob {
  private readonly logger = new Logger(PulseTaskReminderCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly pulseTaskReminderService: PulseTaskReminderService,
  ) {}

  @Process(PulseTaskReminderCronJob.name)
  @SentryCronMonitor(
    PulseTaskReminderCronJob.name,
    PULSE_TASK_REMINDER_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
    });

    for (const workspace of workspaces) {
      await this.pulseTaskReminderService
        .sendWorkspaceReminders(workspace)
        .catch((error) => {
          this.logger.error(
            `Cannot send task reminders for workspace ${workspace.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        });
    }
  }
}
