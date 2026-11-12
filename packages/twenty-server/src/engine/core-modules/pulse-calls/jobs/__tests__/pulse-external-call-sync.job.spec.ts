import { PulseCallSummaryService } from '../../services/pulse-call-summary.service';
import { PulseRecordingService } from '../../services/pulse-recording.service';
import { PulseExternalCallSyncJob } from '../pulse-external-call-sync.job';

const recording = { audio: Buffer.from('audio'), mimeType: 'audio/mpeg', extension: 'mp3' };

const makeJob = () => {
  const pulseRecordingService = {
    download: jest.fn().mockResolvedValue(recording),
    storeOnNote: jest.fn().mockResolvedValue(undefined),
    attachRecording: jest.fn().mockResolvedValue(true),
    saveCallSections: jest.fn().mockResolvedValue(undefined),
  };
  const pulseCallSummaryService = {
    canSummarize: jest.fn().mockReturnValue(true),
    summarize: jest.fn().mockResolvedValue('- discussed pricing'),
  };
  const job = new PulseExternalCallSyncJob(
    pulseRecordingService as unknown as PulseRecordingService,
    pulseCallSummaryService as unknown as PulseCallSummaryService,
  );

  return { job, pulseRecordingService, pulseCallSummaryService };
};

const base = {
  workspaceId: 'ws-1',
  noteId: 'note-1',
  recordingUrl: null,
  transcript: null,
  summary: null,
};

describe('PulseExternalCallSyncJob', () => {
  it('attaches and transcribes the recording when no transcript is provided', async () => {
    const { job, pulseRecordingService } = makeJob();

    await job.handle({ ...base, recordingUrl: 'https://calls.example/r.mp3' });

    expect(pulseRecordingService.download).toHaveBeenCalledWith(
      'https://calls.example/r.mp3',
    );
    expect(pulseRecordingService.attachRecording).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      noteId: 'note-1',
      recording,
      label: 'Call recording',
    });
    expect(pulseRecordingService.storeOnNote).not.toHaveBeenCalled();
    expect(pulseRecordingService.saveCallSections).not.toHaveBeenCalled();
  });

  it('stores the recording without re-transcribing when the app supplied a transcript, then saves sections', async () => {
    const { job, pulseRecordingService, pulseCallSummaryService } = makeJob();

    await job.handle({
      ...base,
      recordingUrl: 'https://calls.example/r.mp3',
      transcript: 'Hello, this is Ann',
      summary: 'Provided summary',
    });

    expect(pulseRecordingService.storeOnNote).toHaveBeenCalled();
    expect(pulseRecordingService.attachRecording).not.toHaveBeenCalled();
    expect(pulseCallSummaryService.summarize).not.toHaveBeenCalled();
    expect(pulseRecordingService.saveCallSections).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      noteId: 'note-1',
      transcript: 'Hello, this is Ann',
      summary: 'Provided summary',
    });
  });

  it('generates an AI summary for a transcript-only call', async () => {
    const { job, pulseRecordingService, pulseCallSummaryService } = makeJob();

    await job.handle({ ...base, transcript: 'Hello, this is Ann' });

    expect(pulseRecordingService.download).not.toHaveBeenCalled();
    expect(pulseCallSummaryService.summarize).toHaveBeenCalledWith(
      'Hello, this is Ann',
    );
    expect(pulseRecordingService.saveCallSections).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      noteId: 'note-1',
      transcript: 'Hello, this is Ann',
      summary: '- discussed pricing',
    });
  });

  it('saves a summary alone and does nothing when the call has no content', async () => {
    const { job, pulseRecordingService } = makeJob();

    await job.handle({ ...base, summary: 'Short call' });
    expect(pulseRecordingService.saveCallSections).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      noteId: 'note-1',
      summary: 'Short call',
    });

    pulseRecordingService.saveCallSections.mockClear();
    await job.handle({ ...base });
    expect(pulseRecordingService.saveCallSections).not.toHaveBeenCalled();
    expect(pulseRecordingService.download).not.toHaveBeenCalled();
  });
});
