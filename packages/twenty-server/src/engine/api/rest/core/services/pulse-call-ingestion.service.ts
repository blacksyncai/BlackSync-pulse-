import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { In } from 'typeorm';
import { v4, v5 } from 'uuid';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type IngestPulseCallDto } from 'src/engine/api/rest/core/dtos/ingest-pulse-call.dto';
import { formatCallDuration } from 'src/engine/core-modules/close-import/utils/close-import-mappers.util';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type PulseExternalCallSyncJobData } from 'src/engine/core-modules/pulse-calls/jobs/pulse-external-call-sync.job';
import { toPhoneCandidates } from 'src/engine/core-modules/pulse-calls/utils/phone-candidates.util';
import {
  buildFollowUpTask,
  FOLLOWUP_OUTCOME_LABELS,
  shouldCreateFollowUpTask,
} from 'src/engine/core-modules/pulse-calls/utils/pulse-call-followup.util';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { type NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export type IngestPulseCallResult = {
  noteId: string;
  created: boolean;
  personId: string | null;
  companyId: string | null;
  opportunityId: string | null;
  followUpTaskId: string | null;
};

@Injectable()
export class PulseCallIngestionService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}
  async ingest(
    input: IngestPulseCallDto,
    authContext: WorkspaceAuthContext,
  ): Promise<IngestPulseCallResult> {
    const noteId = v5(
      JSON.stringify([
        authContext.workspace.id,
        input.source,
        input.externalId,
      ]),
      v5.URL,
    );
    const result = await this.workspaceOrmManager.executeInWorkspaceContext(
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
            const persons =
              this.workspaceOrmManager.getRepositoryWithContextPermissions<PersonWorkspaceEntity>(
                'person',
                transaction,
              );
            const companies =
              this.workspaceOrmManager.getRepositoryWithContextPermissions<CompanyWorkspaceEntity>(
                'company',
                transaction,
              );
            const opportunities =
              this.workspaceOrmManager.getRepositoryWithContextPermissions<OpportunityWorkspaceEntity>(
                'opportunity',
                transaction,
              );

            // Explicit ids win; otherwise the contact is matched on the call's phone number.
            let person: PersonWorkspaceEntity | null = null;
            if (input.personId) {
              person = await persons.findOne({ where: { id: input.personId } });
              if (!person)
                throw new NotFoundException(
                  'Contact not found or not accessible.',
                );
            } else {
              person = await persons.findOne({
                where: {
                  phones: {
                    primaryPhoneNumber: In(
                      toPhoneCandidates(input.phoneNumber),
                    ),
                  },
                },
              });
            }

            let companyId: string | null = input.companyId ?? null;
            if (companyId) {
              const company = await companies.findOne({
                where: { id: companyId },
              });
              if (!company)
                throw new NotFoundException(
                  'Lead not found or not accessible.',
                );
            } else if (person?.companyId) {
              companyId = person.companyId;
            }

            let opportunityId: string | null = null;
            if (input.opportunityId) {
              const opportunity = await opportunities.findOne({
                where: { id: input.opportunityId },
              });
              if (!opportunity)
                throw new NotFoundException(
                  'Opportunity not found or not accessible.',
                );
              opportunityId = input.opportunityId;
            }

            let assigneeId: string | null =
              input.assigneeId ??
              (authContext.type === 'user'
                ? authContext.workspaceMemberId
                : null);
            if (input.assigneeId) {
              const members =
                this.workspaceOrmManager.getRepositoryWithContextPermissions<WorkspaceMemberWorkspaceEntity>(
                  'workspaceMember',
                  transaction,
                );
              const member = await members.findOne({
                where: { id: input.assigneeId },
              });
              if (!member)
                throw new BadRequestException(
                  'Assignee is not a member of this workspace.',
                );
            }

            const existing = await notes.findOne({ where: { id: noteId } });
            if (existing)
              return {
                noteId,
                created: false,
                personId: person?.id ?? null,
                companyId,
                opportunityId,
                followUpTaskId: null,
              };
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
                FOLLOWUP_OUTCOME_LABELS[input.outcome] ?? input.outcome,
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
              ...(person
                ? [{ noteId, targetPersonId: person.id }]
                : []),
              ...(companyId
                ? [{ noteId, targetCompanyId: companyId }]
                : []),
              ...(opportunityId
                ? [{ noteId, targetOpportunityId: opportunityId }]
                : []),
            ]);

            let followUpTaskId: string | null = null;
            if (
              shouldCreateFollowUpTask({
                outcome: input.outcome,
                interest: input.interest,
                nextStep: input.nextStep,
              })
            ) {
              const tasks =
                this.workspaceOrmManager.getRepositoryWithContextPermissions<TaskWorkspaceEntity>(
                  'task',
                  transaction,
                );
              const taskTargets =
                this.workspaceOrmManager.getRepositoryWithContextPermissions<TaskTargetWorkspaceEntity>(
                  'taskTarget',
                  transaction,
                );
              const contactLabel = person
                ? [person.name?.firstName, person.name?.lastName]
                    .filter(isNonEmptyString)
                    .join(' ') || input.phoneNumber
                : input.phoneNumber;
              const draft = buildFollowUpTask({
                contactLabel,
                phoneNumber: input.phoneNumber,
                direction: input.direction,
                outcome: input.outcome,
                interest: input.interest,
                nextStep: input.nextStep,
                nextStepDueAt: input.nextStepDueAt,
                summary: input.summary,
              });
              const taskId = v4();
              await tasks.insert({
                id: taskId,
                title: draft.title,
                bodyV2: await transformRichTextValue({
                  markdown: draft.bodyMarkdown,
                  blocknote: null,
                }),
                dueAt: draft.dueAt,
                status: 'TODO',
                position: Date.now(),
                assigneeId,
                createdBy: actor,
                updatedBy: actor,
              });
              const taskTargetRows = [
                ...(person
                  ? [{ taskId, targetPersonId: person.id }]
                  : []),
                ...(companyId
                  ? [{ taskId, targetCompanyId: companyId }]
                  : []),
                ...(opportunityId
                  ? [{ taskId, targetOpportunityId: opportunityId }]
                  : []),
              ];
              if (taskTargetRows.length > 0)
                await taskTargets.insert(taskTargetRows);
              followUpTaskId = taskId;
            }

            return {
              noteId,
              created: true,
              personId: person?.id ?? null,
              companyId,
              opportunityId,
              followUpTaskId,
            };
          },
        ),
      authContext,
    );

    // Recordings and transcripts are synced off the request path so a slow provider
    // cannot fail the ingestion; the note keeps the public link until then.
    if (
      result.created &&
      (isNonEmptyString(input.recordingUrl) ||
        isNonEmptyString(input.transcript) ||
        isNonEmptyString(input.summary))
    ) {
      await this.messageQueueService.add<PulseExternalCallSyncJobData>(
        'PulseExternalCallSyncJob',
        {
          workspaceId: authContext.workspace.id,
          noteId: result.noteId,
          recordingUrl: input.recordingUrl ?? null,
          transcript: input.transcript ?? null,
          summary: input.summary ?? null,
        },
      );
    }

    return result;
  }
}
