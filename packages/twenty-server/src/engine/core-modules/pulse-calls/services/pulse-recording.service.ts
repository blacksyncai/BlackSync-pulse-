import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldActorSource, FileFolder } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { FileStorageService } from 'src/engine/core-modules/file-storage/services/file-storage.service';
import {
  type DeepgramResponse,
  formatDeepgramTranscript,
} from 'src/engine/core-modules/pulse-calls/utils/format-deepgram-transcript.util';
import { PulseCallSummaryService } from 'src/engine/core-modules/pulse-calls/services/pulse-call-summary.service';
import {
  extractCallNoteSection,
  upsertCallNoteSections,
} from 'src/engine/core-modules/pulse-calls/utils/upsert-call-note-sections.util';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { AttachmentWorkspaceEntity } from 'src/modules/attachment/standard-objects/attachment.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';

const DEEPGRAM_LISTEN_URL =
  'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&diarize=true&utterances=true';

const RECORDED_BY = {
  source: FieldActorSource.SYSTEM,
  name: 'BlackSync Cloud calling',
  workspaceMemberId: null,
  context: {},
};

export type CallRecordingAudio = {
  audio: Buffer;
  mimeType: string;
  extension: string;
};

// Recordings are kept as audio attachments on the call's note, so they play in the
// timeline and survive the recording links expiring at the phone provider.
@Injectable()
export class PulseRecordingService {
  private readonly logger = new Logger(PulseRecordingService.name);

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectWorkspaceScopedRepository(FieldMetadataEntity)
    private readonly fieldMetadataRepository: WorkspaceScopedRepository<FieldMetadataEntity>,
    @InjectWorkspaceScopedRepository(ApplicationEntity)
    private readonly applicationRepository: WorkspaceScopedRepository<ApplicationEntity>,
    private readonly pulseCallSummaryService: PulseCallSummaryService,
  ) {}

  async download(
    url: string,
    headers: Record<string, string> = {},
  ): Promise<CallRecordingAudio | null> {
    const response = await fetch(url, { headers, redirect: 'follow' });

    if (!response.ok) {
      this.logger.warn(`Recording download failed with ${response.status}`);

      return null;
    }

    const contentType = (response.headers.get('content-type') ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    const audio = Buffer.from(await response.arrayBuffer());
    // File storage often serves recordings as generic binary; those are still audio.
    const isGenericBinary =
      contentType === '' ||
      contentType === 'application/octet-stream' ||
      contentType === 'binary/octet-stream';

    if (
      audio.length === 0 ||
      (!contentType.startsWith('audio/') && !isGenericBinary)
    ) {
      this.logger.warn(
        `Recording download returned ${contentType || 'no content type'} (${audio.length} bytes), skipped`,
      );

      return null;
    }

    const isWav =
      contentType.includes('wav') || /\.wav(\?|$)/i.test(response.url);
    const mimeType = contentType.startsWith('audio/')
      ? contentType
      : isWav
        ? 'audio/wav'
        : 'audio/mpeg';

    return {
      audio,
      mimeType,
      extension: isWav ? 'wav' : 'mp3',
    };
  }

  async storeOnNote({
    workspaceId,
    noteId,
    recording,
    label,
  }: {
    workspaceId: string;
    noteId: string;
    recording: CallRecordingAudio;
    label: string;
  }): Promise<void> {
    const fileUniversalIdentifier =
      STANDARD_OBJECTS.attachment.fields.file.universalIdentifier;
    const fieldMetadata = await this.fieldMetadataRepository.findOneOrFail(
      workspaceId,
      {
        select: ['applicationId', 'universalIdentifier'],
        where: { universalIdentifier: fileUniversalIdentifier },
      },
    );
    const application = await this.applicationRepository.findOneOrFail(
      workspaceId,
      { where: { id: fieldMetadata.applicationId } },
    );

    const fileId = v4();

    await this.fileStorageService.writeFile({
      sourceFile: recording.audio,
      resourcePath: `${fieldMetadata.universalIdentifier}/${fileId}.${recording.extension}`,
      fileFolder: FileFolder.FilesField,
      applicationUniversalIdentifier: application.universalIdentifier,
      applicationId: application.id,
      workspaceId,
      fileId,
      settings: { isTemporaryFile: false, toDelete: false },
    });

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const attachmentRepository = this.workspaceOrmManager.getRepository(
        AttachmentWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );

      await attachmentRepository.insert({
        name: label,
        file: [
          {
            fileId,
            label: `${label}.${recording.extension}`,
            extension: recording.extension,
          },
        ],
        targetNoteId: noteId,
        createdBy: RECORDED_BY,
        updatedBy: RECORDED_BY,
      });
    }, buildSystemAuthContext(workspaceId));
  }

  async transcribe(recording: CallRecordingAudio): Promise<string | null> {
    const apiKey = this.twentyConfigService.get('DEEPGRAM_API_KEY');

    if (!isNonEmptyString(apiKey)) {
      return null;
    }

    const response = await fetch(DEEPGRAM_LISTEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': recording.mimeType,
      },
      body: new Uint8Array(recording.audio),
    });

    if (!response.ok) {
      this.logger.warn(
        `Deepgram transcription failed with ${response.status}: ${(await response.text()).slice(0, 200)}`,
      );

      return null;
    }

    return formatDeepgramTranscript(
      (await response.json()) as DeepgramResponse,
    );
  }

  private async readNoteMarkdown(workspaceId: string, noteId: string) {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const noteRepository = this.workspaceOrmManager.getRepository(
        NoteWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const note = await noteRepository.findOne({ where: { id: noteId } });

      return isDefined(note) ? (note.bodyV2?.markdown ?? '') : null;
    }, buildSystemAuthContext(workspaceId));
  }

  async saveCallSections({
    workspaceId,
    noteId,
    transcript,
    summary,
  }: {
    workspaceId: string;
    noteId: string;
    transcript?: string | null;
    summary?: string | null;
  }): Promise<void> {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const noteRepository = this.workspaceOrmManager.getRepository(
        NoteWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const note = await noteRepository.findOne({ where: { id: noteId } });

      if (!isDefined(note)) {
        return;
      }

      const markdown = upsertCallNoteSections(note.bodyV2?.markdown ?? '', {
        transcript,
        summary,
      });

      await noteRepository.update(
        { id: noteId },
        {
          bodyV2: await transformRichTextValue({ markdown, blocknote: null }),
        },
      );
    }, buildSystemAuthContext(workspaceId));
  }

  // A summary failure never loses the transcript; it is saved either way.
  private async saveTranscriptWithSummary(
    workspaceId: string,
    noteId: string,
    transcript: string,
  ) {
    const summary = await this.pulseCallSummaryService
      .summarize(transcript)
      .catch((error) => {
        this.logger.warn(
          `Could not summarize call ${noteId}: ${String(error)}`,
        );

        return null;
      });

    await this.saveCallSections({ workspaceId, noteId, transcript, summary });

    return summary;
  }

  async summarizeCallNote(workspaceId: string, noteId: string) {
    if (!this.pulseCallSummaryService.canSummarize()) {
      throw new Error(
        'AI summaries are not set up (ANTHROPIC_API_KEY is missing)',
      );
    }

    const markdown = await this.readNoteMarkdown(workspaceId, noteId);

    if (markdown === null) {
      throw new Error('That call no longer exists');
    }

    const transcript = extractCallNoteSection(markdown, 'transcript');

    if (!isNonEmptyString(transcript)) {
      throw new Error('This call has no transcript to summarize yet');
    }

    const summary = await this.pulseCallSummaryService.summarize(transcript);

    if (!isNonEmptyString(summary)) {
      throw new Error('The summary could not be generated');
    }

    await this.saveCallSections({ workspaceId, noteId, summary });

    return summary;
  }

  // Only Pulse's own file links are fetched, so a caller can't point the server elsewhere.
  private isPulseFileUrl(recordingUrl: string) {
    try {
      const url = new URL(recordingUrl);
      const serverUrl = new URL(this.twentyConfigService.get('SERVER_URL'));
      const baseDomain = serverUrl.hostname.split('.').slice(-2).join('.');

      return (
        url.protocol === 'https:' &&
        (url.hostname === serverUrl.hostname ||
          url.hostname.endsWith(`.${baseDomain}`) ||
          url.hostname === baseDomain)
      );
    } catch {
      return false;
    }
  }

  async transcribeStoredRecording({
    workspaceId,
    noteId,
    recordingUrl,
  }: {
    workspaceId: string;
    noteId: string;
    recordingUrl: string;
  }): Promise<string | null> {
    if (!isNonEmptyString(this.twentyConfigService.get('DEEPGRAM_API_KEY'))) {
      throw new Error(
        'Transcription is not set up (DEEPGRAM_API_KEY is missing)',
      );
    }

    if (!this.isPulseFileUrl(recordingUrl)) {
      throw new Error(
        'Only recordings stored in BlackSync Cloud can be transcribed',
      );
    }

    const recording = await this.download(recordingUrl);

    if (!isDefined(recording)) {
      throw new Error('The recording could not be downloaded');
    }

    const transcript = await this.transcribe(recording);

    if (!isNonEmptyString(transcript)) {
      return null;
    }

    const summary = await this.saveTranscriptWithSummary(
      workspaceId,
      noteId,
      transcript,
    );

    // Returned in the note's own section format so the card can show both at once.
    return upsertCallNoteSections('', { summary, transcript });
  }

  // Store and transcribe in one go; failures are logged so a bad recording never
  // breaks the call log or an import.
  async attachRecording({
    workspaceId,
    noteId,
    recording,
    label,
  }: {
    workspaceId: string;
    noteId: string;
    recording: CallRecordingAudio;
    label: string;
  }): Promise<boolean> {
    try {
      await this.storeOnNote({ workspaceId, noteId, recording, label });
    } catch (error) {
      this.logger.error(
        `Could not store recording for note ${noteId}`,
        error instanceof Error ? error.stack : String(error),
      );

      return false;
    }

    try {
      const transcript = await this.transcribe(recording);

      if (isNonEmptyString(transcript)) {
        await this.saveTranscriptWithSummary(workspaceId, noteId, transcript);
      }
    } catch (error) {
      this.logger.warn(
        `Could not transcribe recording for note ${noteId}: ${String(error)}`,
      );
    }

    return true;
  }
}
