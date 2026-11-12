import { Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PulseCallSummaryService } from 'src/engine/core-modules/pulse-calls/services/pulse-call-summary.service';
import { PulseRecordingService } from 'src/engine/core-modules/pulse-calls/services/pulse-recording.service';

export type PulseExternalCallSyncJobData = {
  workspaceId: string;
  noteId: string;
  recordingUrl?: string | null;
  transcript?: string | null;
  summary?: string | null;
};

// The calling app reports a call once it ends, but the recording file can lag a few
// seconds at the provider, so the download is retried briefly before giving up.
const DOWNLOAD_ATTEMPTS = 6;
const DOWNLOAD_INTERVAL_MS = 10_000;

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

@Processor(MessageQueue.workspaceQueue)
export class PulseExternalCallSyncJob {
  private readonly logger = new Logger(PulseExternalCallSyncJob.name);

  constructor(
    private readonly pulseRecordingService: PulseRecordingService,
    private readonly pulseCallSummaryService: PulseCallSummaryService,
  ) {}

  @Process(PulseExternalCallSyncJob.name)
  async handle({
    workspaceId,
    noteId,
    recordingUrl,
    transcript,
    summary,
  }: PulseExternalCallSyncJobData): Promise<void> {
    if (isNonEmptyString(recordingUrl)) {
      let recording = null;

      for (
        let attempt = 0;
        attempt < DOWNLOAD_ATTEMPTS && recording === null;
        attempt++
      ) {
        if (attempt > 0) await sleep(DOWNLOAD_INTERVAL_MS);
        recording = await this.pulseRecordingService
          .download(recordingUrl)
          .catch(() => null);
      }

      if (recording !== null) {
        // A transcript supplied by the calling app wins over re-transcribing the audio.
        if (isNonEmptyString(transcript)) {
          await this.pulseRecordingService.storeOnNote({
            workspaceId,
            noteId,
            recording,
            label: 'Call recording',
          });
        } else {
          await this.pulseRecordingService.attachRecording({
            workspaceId,
            noteId,
            recording,
            label: 'Call recording',
          });
        }
      } else {
        this.logger.warn(
          `External recording could not be downloaded for note ${noteId}`,
        );
      }
    }

    if (isNonEmptyString(transcript)) {
      const finalSummary = isNonEmptyString(summary)
        ? summary
        : this.pulseCallSummaryService.canSummarize()
          ? await this.pulseCallSummaryService
              .summarize(transcript)
              .catch(() => null)
          : null;

      await this.pulseRecordingService.saveCallSections({
        workspaceId,
        noteId,
        transcript,
        summary: finalSummary,
      });
    } else if (isNonEmptyString(summary)) {
      await this.pulseRecordingService.saveCallSections({
        workspaceId,
        noteId,
        summary,
      });
    }
  }
}
