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

    const mimeType = response.headers.get('content-type') ?? 'audio/mpeg';
    const audio = Buffer.from(await response.arrayBuffer());

    if (audio.length === 0 || !mimeType.startsWith('audio/')) {
      return null;
    }

    return {
      audio,
      mimeType,
      extension: mimeType.includes('wav') ? 'wav' : 'mp3',
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

  async appendTranscript({
    workspaceId,
    noteId,
    transcript,
  }: {
    workspaceId: string;
    noteId: string;
    transcript: string;
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

      const markdown = [
        note.bodyV2?.markdown,
        `**Transcript**\n\n${transcript}`,
      ]
        .filter(isNonEmptyString)
        .join('\n\n');

      await noteRepository.update(
        { id: noteId },
        {
          bodyV2: await transformRichTextValue({ markdown, blocknote: null }),
        },
      );
    }, buildSystemAuthContext(workspaceId));
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
      throw new Error('Only recordings stored in BlackSync Cloud can be transcribed');
    }

    const recording = await this.download(recordingUrl);

    if (!isDefined(recording)) {
      throw new Error('The recording could not be downloaded');
    }

    const transcript = await this.transcribe(recording);

    if (!isNonEmptyString(transcript)) {
      return null;
    }

    await this.appendTranscript({ workspaceId, noteId, transcript });

    return transcript;
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
        await this.appendTranscript({ workspaceId, noteId, transcript });
      }
    } catch (error) {
      this.logger.warn(
        `Could not transcribe recording for note ${noteId}: ${String(error)}`,
      );
    }

    return true;
  }
}
