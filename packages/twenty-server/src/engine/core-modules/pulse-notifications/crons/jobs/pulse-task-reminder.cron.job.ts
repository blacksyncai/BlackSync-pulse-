import { PulseTicketEmailService } from 'src/engine/core-modules/pulse-tickets/services/pulse-ticket-email.service';
import { PulseWelcomeService } from 'src/engine/core-modules/pulse-welcome/services/pulse-welcome.service';
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
    private readonly welcome: PulseWelcomeService,
    private readonly ticketEmail: PulseTicketEmailService,
  ) {}

  @Process(PulseTaskReminderCronJob.name)
  @SentryCronMonitor(
    PulseTaskReminderCronJob.name,
    PULSE_TASK_REMINDER_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    await this.welcome
      .dispatchPending()
      .catch(() =>
        this.logger.error(
          'Pending welcome emails could not be queued; the next run will retry.',
        ),
      );
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
    });

    for (const workspace of workspaces) {
      await this.ticketEmail
        .scanWorkspace(workspace.id)
        .catch(() =>
          this.logger.error(
            `Client ticket capture could not run for workspace ${workspace.id}.`,
          ),
        );
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
