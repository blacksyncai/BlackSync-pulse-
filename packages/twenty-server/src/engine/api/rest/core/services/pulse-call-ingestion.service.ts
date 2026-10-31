import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v5 } from 'uuid';
import { FieldActorSource } from 'twenty-shared/types';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type IngestPulseCallDto } from 'src/engine/api/rest/core/dtos/ingest-pulse-call.dto';
import { formatCallDuration } from 'src/engine/core-modules/close-import/utils/close-import-mappers.util';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';

const OUTCOME_LABELS: Record<string, string> = {
  answered: 'Answered',
  'no-answer': 'No answer',
  busy: 'Busy',
  failed: 'Failed',
  voicemail: 'Voicemail',
  canceled: 'Canceled',
};

@Injectable()
export class PulseCallIngestionService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}
  async ingest(
    input: IngestPulseCallDto,
    authContext: WorkspaceAuthContext,
  ): Promise<{ noteId: string; created: boolean }> {
    if (!input.personId && !input.companyId)
      throw new BadRequestException(
        'Provide personId or companyId to attach the call.',
      );
    const noteId = v5(
      JSON.stringify([
        authContext.workspace.id,
        input.source,
        input.externalId,
      ]),
      v5.URL,
    );
    return this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager.runInWorkspaceTransaction(
          async (transaction) => {
            // Serialize retries before writing the note and its targets; both commit together.
            await transaction.executeRawQuery(
              'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
              [`pulse-call:${authContext.workspace.id}:${noteId}`],
            );
            const notes =
              this.workspaceOrmManager.getRepositoryWithContextPermissions<NoteWorkspaceEntity>(
                'note',
                transaction,
              );
            const targets =
              this.workspaceOrmManager.getRepositoryWithContextPermissions<NoteTargetWorkspaceEntity>(
                'noteTarget',
                transaction,
              );
            if (input.personId) {
              const person = await this.workspaceOrmManager
                .getRepositoryWithContextPermissions<PersonWorkspaceEntity>(
                  'person',
                  transaction,
                )
                .findOne({ where: { id: input.personId } });
              if (!person)
                throw new NotFoundException(
                  'Contact not found or not accessible.',
                );
            }
            if (input.companyId) {
              const company = await this.workspaceOrmManager
                .getRepositoryWithContextPermissions<CompanyWorkspaceEntity>(
                  'company',
                  transaction,
                )
                .findOne({ where: { id: input.companyId } });
              if (!company)
                throw new NotFoundException(
                  'Lead not found or not accessible.',
                );
            }
            const existing = await notes.findOne({ where: { id: noteId } });
            if (existing) return { noteId, created: false };
            const actor = {
              source: FieldActorSource.API,
              name: input.source,
              workspaceMemberId: null,
              context: {},
            };
            const markdown = [
              `Phone: ${input.phoneNumber}`,
              `Source: ${input.source}`,
              `External ID: ${input.externalId.replace(/[\r\n]/g, ' ')}`,
              input.recordingUrl
                ? `[Call recording](${input.recordingUrl})`
                : null,
              input.summary ? `**Summary**\n${input.summary}` : null,
              input.transcript ? `**Transcript**\n${input.transcript}` : null,
            ]
              .filter(Boolean)
              .join('\n\n');
            await notes.insert({
              id: noteId,
              title: [
                input.direction === 'inbound'
                  ? 'Inbound call'
                  : 'Outbound call',
                formatCallDuration(input.durationSeconds),
                OUTCOME_LABELS[input.outcome],
              ].join(' · '),
              bodyV2: await transformRichTextValue({
                markdown,
                blocknote: null,
              }),
              position: Date.now(),
              createdBy: actor,
              updatedBy: actor,
            });
            await targets.insert([
              ...(input.personId
                ? [{ noteId, targetPersonId: input.personId }]
                : []),
              ...(input.companyId
                ? [{ noteId, targetCompanyId: input.companyId }]
                : []),
            ]);
            return { noteId, created: true };
          },
        ),
      authContext,
    );
  }
}
