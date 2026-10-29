import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { PULSE_TASK_REMINDER_CRON_PATTERN } from 'src/engine/core-modules/pulse-notifications/constants/pulse-task-reminder-cron-pattern.constant';
import { PulseTaskReminderCronJob } from 'src/engine/core-modules/pulse-notifications/crons/jobs/pulse-task-reminder.cron.job';

@Command({
  name: 'cron:pulse:task-reminders',
  description:
    'Starts a cron job that emails task assignments and due reminders',
})
export class PulseTaskReminderCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: PulseTaskReminderCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: PULSE_TASK_REMINDER_CRON_PATTERN },
      },
    });
  }
}
