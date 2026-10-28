import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PlivoService } from 'src/engine/core-modules/plivo/services/plivo.service';
import { PulseRecordingService } from 'src/engine/core-modules/pulse-calls/services/pulse-recording.service';

export type PulseCallRecordingJobData = {
  workspaceId: string;
  noteId: string;
  callUuid: string;
};

const RECORDING_POLL_ATTEMPTS = 12;
const RECORDING_POLL_INTERVAL_MS = 20_000;

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

@Processor(MessageQueue.workspaceQueue)
export class PulseCallRecordingJob {
  private readonly logger = new Logger(PulseCallRecordingJob.name);

  constructor(
    private readonly plivoService: PlivoService,
    private readonly pulseRecordingService: PulseRecordingService,
  ) {}

  @Process(PulseCallRecordingJob.name)
  async handle({
    workspaceId,
    noteId,
    callUuid,
  }: PulseCallRecordingJobData): Promise<void> {
    for (let attempt = 0; attempt < RECORDING_POLL_ATTEMPTS; attempt++) {
      const recordingUrl = await this.plivoService
        .findRecordingUrl(callUuid)
        .catch(() => null);

      if (recordingUrl !== null) {
        const recording =
          (await this.pulseRecordingService.download(recordingUrl)) ??
          (await this.pulseRecordingService.download(
            recordingUrl,
            this.plivoService.basicAuthHeader(),
          ));

        if (recording !== null) {
          await this.pulseRecordingService.attachRecording({
            workspaceId,
            noteId,
            recording,
            label: 'Call recording',
          });
        }

        return;
      }

      await sleep(RECORDING_POLL_INTERVAL_MS);
    }

    this.logger.warn(`No Plivo recording found for call ${callUuid}`);
  }
}
