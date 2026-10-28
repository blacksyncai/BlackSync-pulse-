import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';
import { v4 } from 'uuid';

import { formatCallDuration } from 'src/engine/core-modules/close-import/utils/close-import-mappers.util';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type LogPulseCallInput } from 'src/engine/core-modules/pulse-calls/dtos/log-pulse-call.input';
import { type PulseCallRecordingJobData } from 'src/engine/core-modules/pulse-calls/jobs/pulse-call-recording.job';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';

const OUTCOME_LABELS: Record<string, string> = {
  answered: 'Answered',
  'no-answer': 'No answer',
  busy: 'Busy',
  failed: 'Failed',
};

// Matches how phone numbers are stored on people: national number without the calling code.
const toPhoneCandidates = (phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, '');

  return [...new Set([digits, digits.slice(-10)].filter(isNonEmptyString))];
};

@Injectable()
export class PulseCallLogService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  // Calls are logged as notes titled like imported Close calls, so the timeline and the
  // dashboard's dial count treat both the same way.
  async logCall({
    workspaceId,
    workspaceMemberId,
    callerName,
    input,
  }: {
    workspaceId: string;
    workspaceMemberId: string | undefined;
    callerName: string;
    input: LogPulseCallInput;
  }): Promise<string> {
    const noteId = v4();
    const loggedBy = {
      source: FieldActorSource.MANUAL,
      name: callerName,
      workspaceMemberId: workspaceMemberId ?? null,
      context: {},
    };

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const personRepository = this.workspaceOrmManager.getRepository(
        PersonWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const noteRepository = this.workspaceOrmManager.getRepository(
        NoteWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );
      const noteTargetRepository = this.workspaceOrmManager.getRepository(
        NoteTargetWorkspaceEntity,
        { shouldBypassPermissionChecks: true },
      );

      const person = isNonEmptyString(input.personId)
        ? await personRepository.findOne({ where: { id: input.personId } })
        : await personRepository.findOne({
            where: {
              phones: {
                primaryPhoneNumber: In(toPhoneCandidates(input.phoneNumber)),
              },
            },
          });
      const companyId = isNonEmptyString(input.companyId)
        ? input.companyId
        : (person?.companyId ?? null);

      const title = [
        'Outbound call',
        formatCallDuration(input.durationSeconds),
        OUTCOME_LABELS[input.outcome] ?? input.outcome,
      ].join(' · ');

      await noteRepository.insert({
        id: noteId,
        title,
        bodyV2: await transformRichTextValue({
          markdown: `Phone: ${input.phoneNumber}`,
          blocknote: null,
        }),
        position: Date.now(),
        createdBy: loggedBy,
        updatedBy: loggedBy,
      });

      const targets = [
        ...(isDefined(person) ? [{ noteId, targetPersonId: person.id }] : []),
        ...(isNonEmptyString(companyId)
          ? [{ noteId, targetCompanyId: companyId }]
          : []),
      ];

      if (targets.length > 0) {
        await noteTargetRepository.insert(targets);
      }
    }, buildSystemAuthContext(workspaceId));

    if (input.isRecorded && isNonEmptyString(input.callUuid)) {
      await this.messageQueueService.add<PulseCallRecordingJobData>(
        'PulseCallRecordingJob',
        { workspaceId, noteId, callUuid: input.callUuid },
      );
    }

    return noteId;
  }
}
