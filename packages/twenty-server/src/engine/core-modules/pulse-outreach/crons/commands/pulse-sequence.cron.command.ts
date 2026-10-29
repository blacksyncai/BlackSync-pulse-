import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { PULSE_SEQUENCE_CRON_PATTERN } from 'src/engine/core-modules/pulse-outreach/constants/pulse-sequence-cron-pattern.constant';
import { PulseSequenceCronJob } from 'src/engine/core-modules/pulse-outreach/crons/jobs/pulse-sequence.cron.job';

@Command({
  name: 'cron:pulse:sequences',
  description: 'Starts a cron job that sends due Pulse sequence emails',
})
export class PulseSequenceCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: PulseSequenceCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: PULSE_SEQUENCE_CRON_PATTERN },
      },
    });
  }
}
