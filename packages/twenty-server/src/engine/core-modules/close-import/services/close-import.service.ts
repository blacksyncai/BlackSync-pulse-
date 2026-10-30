import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In, type ObjectLiteral } from 'typeorm';
import { v4 } from 'uuid';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import {
  CloseApiClient,
  CloseApiError,
} from 'src/engine/core-modules/close-import/services/close-api.client';
import {
  type CloseActivityBase,
  type CloseCallActivity,
  type CloseEmailActivity,
  type CloseLead,
  type CloseLeadStatus,
  type CloseNoteActivity,
  type CloseOpportunity,
  type ClosePipeline,
  type CloseSmsActivity,
  type CloseTask,
} from 'src/engine/core-modules/close-import/types/close-api.type';
import {
  type CloseImportCounts,
  type CloseImportJobData,
  type CloseImportStatus,
} from 'src/engine/core-modules/close-import/types/close-import-status.type';
import { PulsePipelineProvisioningService } from 'src/engine/core-modules/close-import/services/pulse-pipeline-provisioning.service';
import { PulseRecordingService } from 'src/engine/core-modules/pulse-calls/services/pulse-recording.service';
import {
  buildCallNote,
  getCloseStatusColor,
  buildEmailNote,
  buildSmsNote,
  mapCloseEmails,
  mapCloseLeadAddress,
  mapCloseLeadDomain,
  mapCloseOpportunityStage,
  mapClosePhones,
  splitFullName,
} from 'src/engine/core-modules/close-import/utils/close-import-mappers.util';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { type WorkspaceRepository } from 'src/engine/twenty-orm/repository/workspace-repository';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';

// Kept in the database: the cache is flushed on every deploy, and losing the id map
// would make the next sync import everything a second time.
const STATUS_KEY = 'pulse-close-import:status';
const IMPORTED_IDS_KEY = 'pulse-close-import:ids';
// A running import refreshes its status at least this often; older means the worker died.
const STALE_RUN_MS = 15 * 60 * 1000;
const EMAIL_BODY_MAX_LENGTH = 20_000;
const LEAD_STATUS_FIELD_NAME = 'leadStatus';
const REMOVAL_BATCH_SIZE = 500;
const RECORDING_CONCURRENCY = 4;

const IMPORTED_BY = {
  source: FieldActorSource.IMPORT,
  name: 'Close import',
  workspaceMemberId: null,
  context: {},
};

const EMPTY_COUNTS: CloseImportCounts = {
  companies: 0,
  people: 0,
  opportunities: 0,
  notes: 0,
  calls: 0,
  emails: 0,
  texts: 0,
  tasks: 0,
};

type StoredCloseImportStatus = CloseImportStatus & { heartbeatAt: number };

type ActivityNote = { title: string; markdown: string };

export class CloseImportAlreadyRunningError extends Error {}

@Injectable()
export class CloseImportService {
  private readonly logger = new Logger(CloseImportService.name);

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly keyValuePairService: KeyValuePairService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly pulsePipelineProvisioningService: PulsePipelineProvisioningService,
    private readonly pulseRecordingService: PulseRecordingService,
  ) {}

  async getStatus(workspaceId: string): Promise<CloseImportStatus> {
    const stored = await this.readStored<StoredCloseImportStatus>(
      workspaceId,
      STATUS_KEY,
    );

    if (!isDefined(stored)) {
      return {
        state: 'idle',
        organizationName: null,
        currentStep: null,
        counts: EMPTY_COUNTS,
        error: null,
        startedAt: null,
        finishedAt: null,
      };
    }

    const { heartbeatAt, ...status } = stored;

    if (status.state === 'running' && Date.now() - heartbeatAt > STALE_RUN_MS) {
      return {
        ...status,
        state: 'failed',
        error: 'The import stopped unexpectedly. Run it again to continue.',
      };
    }

    return status;
  }

  async start(
    workspaceId: string,
    apiKey: string,
    userWorkspaceId?: string,
  ): Promise<CloseImportStatus> {
    const current = await this.getStatus(workspaceId);

    if (current.state === 'running') {
      throw new CloseImportAlreadyRunningError();
    }

    const client = new CloseApiClient(apiKey.trim());
    const me = await client.get<{ organizations: { name: string }[] }>('/me/');
    const organizationName = me.organizations?.[0]?.name ?? 'Close';

    const status: CloseImportStatus = {
      state: 'running',
      organizationName,
      currentStep: 'Queued',
      counts: EMPTY_COUNTS,
      error: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    await this.saveStatus(workspaceId, status);

    await this.messageQueueService.add<CloseImportJobData>('CloseImportJob', {
      workspaceId,
      apiKey: apiKey.trim(),
      organizationName,
      userWorkspaceId,
    });

    return status;
  }

  async run({
    workspaceId,
    apiKey,
    organizationName,
    userWorkspaceId,
  }: CloseImportJobData): Promise<void> {
    const client = new CloseApiClient(apiKey);
    const status: CloseImportStatus = {
      state: 'running',
      organizationName,
      currentStep: 'Accounts and contacts',
      counts: { ...EMPTY_COUNTS },
      error: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };
    // Close ids already imported, so a re-run only adds what is new.
    const importedIds =
      (await this.readStored<Record<string, string>>(
        workspaceId,
        IMPORTED_IDS_KEY,
      )) ?? {};

    const saveProgress = async () => {
      await this.saveStatus(workspaceId, status);
      await this.writeStored(workspaceId, IMPORTED_IDS_KEY, importedIds);
    };

    try {
      // Without the id map, earlier imported records can't be matched, so they are
      // cleared first instead of being imported a second time.
      if (Object.keys(importedIds).length === 0) {
        status.currentStep = 'Clearing an earlier import';
        await saveProgress();
        await this.deleteImportedRecords(workspaceId, () =>
          this.saveStatus(workspaceId, status),
        );
      }

      status.currentStep = 'Pipelines and stages';
      await saveProgress();

      // Close lead statuses and opportunity pipelines are rebuilt first, with the same
      // names and order, so every record lands where it was in Close.
      const leadStatuses = await client.get<{ data: CloseLeadStatus[] }>(
        '/status/lead/',
      );
      const leadStatusField =
        await this.pulsePipelineProvisioningService.ensureSelectField({
          workspaceId,
          objectNameSingular: 'company',
          fieldName: LEAD_STATUS_FIELD_NAME,
          label: 'Lead status',
          icon: 'IconFlag',
          options: leadStatuses.data.map((leadStatus, index) => ({
            label: leadStatus.label,
            color: getCloseStatusColor(leadStatus, index),
          })),
        });

      await this.pulsePipelineProvisioningService.ensureKanbanBoard({
        workspaceId,
        userWorkspaceId,
        objectNameSingular: 'company',
        name: 'Leads',
        groupByFieldId: leadStatusField.fieldId,
        cardFieldNames: ['name', 'domainName', 'accountOwner'],
      });

      const leadStatusValue = (label: string | null) =>
        isNonEmptyString(label)
          ? leadStatusField.valueByLabel.get(label.trim().toLowerCase())
          : undefined;

      const closePipelines = new Map<
        string,
        {
          pipelineValue: string;
          stageFieldName: string;
          stageValueByStatusId: Map<string, string>;
        }
      >();
      const pipelines = await client.get<{ data: ClosePipeline[] }>(
        '/pipeline/',
      );

      for (const pipeline of pipelines.data) {
        const provisioned =
          await this.pulsePipelineProvisioningService.ensureOpportunityPipeline(
            {
              workspaceId,
              userWorkspaceId,
              name: pipeline.name,
              stages: pipeline.statuses.map((closeStatus, index) => ({
                label: closeStatus.label,
                color: getCloseStatusColor(closeStatus, index),
              })),
            },
          );

        closePipelines.set(pipeline.id, {
          pipelineValue: provisioned.pipelineValue,
          stageFieldName: provisioned.stageFieldName,
          stageValueByStatusId: new Map(
            pipeline.statuses.flatMap((closeStatus) => {
              const value = provisioned.stageValueByLabel.get(
                closeStatus.label.trim().toLowerCase(),
              );

              return isDefined(value) ? [[closeStatus.id, value]] : [];
            }),
          ),
        });
      }

      const placement = (opportunity: CloseOpportunity) => {
        const pipeline = isNonEmptyString(opportunity.pipeline_id)
          ? closePipelines.get(opportunity.pipeline_id)
          : undefined;
        const stageValue = isNonEmptyString(opportunity.status_id)
          ? pipeline?.stageValueByStatusId.get(opportunity.status_id)
          : undefined;

        return {
          stage: mapCloseOpportunityStage(opportunity),
          ...(isDefined(pipeline) && isDefined(stageValue)
            ? {
                pipeline: pipeline.pipelineValue,
                [pipeline.stageFieldName]: stageValue,
              }
            : {}),
        };
      };

      // Older imports stored lost deals as notes under the plain Close id.
      const dealIdFor = (opportunity: CloseOpportunity) =>
        importedIds[`${opportunity.id}:deal`] ?? importedIds[opportunity.id];

      status.currentStep = 'Accounts and contacts';
      await saveProgress();

      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const repositoryOptions = { shouldSkipEventEmission: true };
        const permissionOptions = {
          shouldBypassPermissionChecks: true,
        } as const;
        const companyRepository = this.workspaceOrmManager.getRepository(
          CompanyWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );
        const personRepository = this.workspaceOrmManager.getRepository(
          PersonWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );
        const opportunityRepository = this.workspaceOrmManager.getRepository(
          OpportunityWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );
        const noteRepository = this.workspaceOrmManager.getRepository(
          NoteWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );
        const noteTargetRepository = this.workspaceOrmManager.getRepository(
          NoteTargetWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );
        const taskRepository = this.workspaceOrmManager.getRepository(
          TaskWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );
        const taskTargetRepository = this.workspaceOrmManager.getRepository(
          TaskTargetWorkspaceEntity,
          permissionOptions,
          repositoryOptions,
        );

        let position = Date.now();
        const nextPosition = () => position++;

        const insertNotes = async (
          notes: {
            closeId: string;
            note: ActivityNote;
            createdAt: string | null;
            companyId: string | undefined;
            personId: string | undefined;
          }[],
        ) => {
          if (notes.length === 0) {
            return;
          }

          const rows = await Promise.all(
            notes.map(async ({ note, createdAt }) => ({
              id: v4(),
              title: note.title.slice(0, 250),
              bodyV2: await transformRichTextValue({
                markdown: note.markdown,
                blocknote: null,
              }),
              position: nextPosition(),
              createdBy: IMPORTED_BY,
              updatedBy: IMPORTED_BY,
              ...(isNonEmptyString(createdAt)
                ? { createdAt: new Date(createdAt) }
                : {}),
            })),
          );

          await noteRepository.insert(rows);

          const targets = notes.flatMap(({ companyId, personId }, index) => [
            ...(isDefined(companyId)
              ? [{ noteId: rows[index].id, targetCompanyId: companyId }]
              : []),
            ...(isDefined(personId)
              ? [{ noteId: rows[index].id, targetPersonId: personId }]
              : []),
          ]);

          if (targets.length > 0) {
            await noteTargetRepository.insert(targets);
          }

          notes.forEach(({ closeId }, index) => {
            importedIds[closeId] = rows[index].id;
          });
        };

        for await (const leads of client.paginate<CloseLead>('/lead/', {
          _fields:
            'id,display_name,url,description,status_label,addresses,contacts',
        })) {
          const newLeads = leads.filter((lead) => !importedIds[lead.id]);

          // Accounts from an earlier import pick up their Close lead status.
          for (const lead of leads) {
            const companyId = importedIds[lead.id];
            const value = leadStatusValue(lead.status_label);

            if (
              isDefined(companyId) &&
              !newLeads.includes(lead) &&
              isDefined(value)
            ) {
              await companyRepository.update(
                { id: companyId },
                { [LEAD_STATUS_FIELD_NAME]: value },
              );
            }
          }

          // Website and primary email are unique in Pulse, so leads or contacts that
          // share one are merged into the existing record instead of failing the import.
          const companyIdByUrl = await this.findIdsByUniqueValue(
            companyRepository,
            'domainName',
            'primaryLinkUrl',
            newLeads.map((lead) => mapCloseLeadDomain(lead.url).primaryLinkUrl),
          );

          const companies = newLeads.flatMap((lead) => {
            const domainName = mapCloseLeadDomain(lead.url);
            const existingId = isNonEmptyString(domainName.primaryLinkUrl)
              ? companyIdByUrl.get(domainName.primaryLinkUrl)
              : undefined;

            if (isDefined(existingId)) {
              importedIds[lead.id] = existingId;

              return [];
            }

            const id = v4();

            importedIds[lead.id] = id;

            if (isNonEmptyString(domainName.primaryLinkUrl)) {
              companyIdByUrl.set(domainName.primaryLinkUrl, id);
            }

            return [
              {
                id,
                name: lead.display_name || 'Untitled account',
                domainName,
                [LEAD_STATUS_FIELD_NAME]:
                  leadStatusValue(lead.status_label) ?? null,
                address: mapCloseLeadAddress(lead),
                position: nextPosition(),
                createdBy: IMPORTED_BY,
                updatedBy: IMPORTED_BY,
              },
            ];
          });

          if (companies.length > 0) {
            await companyRepository.insert(companies);
          }

          status.counts.companies += companies.length;

          const newContacts = leads.flatMap((lead) =>
            (lead.contacts ?? [])
              .filter((contact) => !importedIds[contact.id])
              .map((contact) => ({ lead, contact })),
          );

          const personIdByEmail = await this.findIdsByUniqueValue(
            personRepository,
            'emails',
            'primaryEmail',
            newContacts.map(
              ({ contact }) =>
                mapCloseEmails(contact.emails ?? []).primaryEmail,
            ),
          );

          const people = newContacts.flatMap(({ lead, contact }) => {
            const emails = mapCloseEmails(contact.emails ?? []);
            const existingId = isNonEmptyString(emails.primaryEmail)
              ? personIdByEmail.get(emails.primaryEmail)
              : undefined;

            if (isDefined(existingId)) {
              importedIds[contact.id] = existingId;

              return [];
            }

            const id = v4();

            importedIds[contact.id] = id;

            if (isNonEmptyString(emails.primaryEmail)) {
              personIdByEmail.set(emails.primaryEmail, id);
            }

            return [
              {
                id,
                name: splitFullName(contact.name),
                jobTitle: contact.title ?? '',
                emails,
                phones: mapClosePhones(contact.phones ?? []),
                companyId: importedIds[lead.id],
                position: nextPosition(),
                createdBy: IMPORTED_BY,
                updatedBy: IMPORTED_BY,
              },
            ];
          });

          if (people.length > 0) {
            await personRepository.insert(people);
          }

          status.counts.people += people.length;

          await insertNotes(
            newLeads
              .filter(
                (lead) =>
                  isNonEmptyString(lead.description) ||
                  isNonEmptyString(lead.status_label),
              )
              .map((lead) => ({
                closeId: `${lead.id}:details`,
                note: {
                  title: 'Imported from Close',
                  markdown: [
                    isNonEmptyString(lead.status_label)
                      ? `Lead status: **${lead.status_label}**`
                      : null,
                    lead.description,
                  ]
                    .filter(isNonEmptyString)
                    .join('\n\n'),
                },
                createdAt: null,
                companyId: importedIds[lead.id],
                personId: undefined,
              })),
          );

          await saveProgress();
        }

        status.currentStep = 'Deals';
        await saveProgress();

        for await (const opportunities of client.paginate<CloseOpportunity>(
          '/opportunity/',
        )) {
          const previouslyImportedIds = opportunities
            .map(dealIdFor)
            .filter(isNonEmptyString);
          const existingDealIds = new Set(
            previouslyImportedIds.length > 0
              ? (
                  await opportunityRepository.find({
                    where: { id: In(previouslyImportedIds) },
                    select: { id: true },
                  })
                ).map((deal) => deal.id)
              : [],
          );

          // Deals from an earlier import are moved into their Close pipeline and stage.
          for (const opportunity of opportunities) {
            const dealId = dealIdFor(opportunity);

            if (isDefined(dealId) && existingDealIds.has(dealId)) {
              await opportunityRepository.update(
                { id: dealId },
                placement(opportunity),
              );
            }
          }

          const newOpportunities = opportunities.filter(
            (opportunity) => !existingDealIds.has(dealIdFor(opportunity) ?? ''),
          );

          const rows = newOpportunities.map((opportunity) => ({
            id: v4(),
            name:
              [
                opportunity.lead_name,
                opportunity.note?.split('\n')[0]?.slice(0, 80),
              ]
                .filter(isNonEmptyString)
                .join(' · ')
                .slice(0, 200) || 'Untitled deal',
            amount: {
              amountMicros: Math.round((opportunity.value ?? 0) * 10_000),
              currencyCode: opportunity.value_currency || 'USD',
            },
            ...placement(opportunity),
            closeDate: isNonEmptyString(opportunity.date_won)
              ? new Date(opportunity.date_won)
              : null,
            companyId: importedIds[opportunity.lead_id] ?? null,
            pointOfContactId: isNonEmptyString(opportunity.contact_id)
              ? (importedIds[opportunity.contact_id] ?? null)
              : null,
            position: nextPosition(),
            createdBy: IMPORTED_BY,
            updatedBy: IMPORTED_BY,
          }));

          if (rows.length > 0) {
            await opportunityRepository.insert(rows);
          }

          newOpportunities.forEach((opportunity, index) => {
            importedIds[`${opportunity.id}:deal`] = rows[index].id;
          });
          status.counts.opportunities += rows.length;

          await saveProgress();
        }

        const importActivities = async <TActivity extends CloseActivityBase>(
          step: string,
          path: string,
          countKey: keyof CloseImportCounts,
          toNote: (activity: TActivity) => ActivityNote,
          afterPage?: (activities: TActivity[]) => Promise<void>,
        ) => {
          status.currentStep = step;
          await saveProgress();

          for await (const activities of client.paginate<TActivity>(path)) {
            const newActivities = activities.filter(
              (activity) => !importedIds[activity.id],
            );

            await insertNotes(
              newActivities.map((activity) => ({
                closeId: activity.id,
                note: toNote(activity),
                createdAt: activity.date_created,
                companyId: isNonEmptyString(activity.lead_id)
                  ? importedIds[activity.lead_id]
                  : undefined,
                personId: isNonEmptyString(activity.contact_id)
                  ? importedIds[activity.contact_id]
                  : undefined,
              })),
            );

            status.counts[countKey] += newActivities.length;
            await afterPage?.(activities);
            await saveProgress();
          }
        };

        // Close recording links need the Close login and expire, so the audio is copied
        // into Pulse (and transcribed) the first time each call is imported.
        const copyRecordings = async (calls: CloseCallActivity[]) => {
          const candidates = calls.filter(
            (call) =>
              isNonEmptyString(call.recording_url ?? call.voicemail_url) &&
              isDefined(importedIds[call.id]),
          );

          if (candidates.length === 0) {
            return;
          }

          // The attachment itself is the source of truth, so a sync also repairs calls
          // whose recording was lost, not only ones it has never seen.
          const noteIdsWithRecording =
            await this.pulseRecordingService.findNotesWithStoredRecording(
              workspaceId,
              candidates.map((call) => importedIds[call.id]),
            );
          const pending = candidates.filter(
            (call) => !noteIdsWithRecording.has(importedIds[call.id]),
          );

          for (
            let start = 0;
            start < pending.length;
            start += RECORDING_CONCURRENCY
          ) {
            await Promise.all(
              pending
                .slice(start, start + RECORDING_CONCURRENCY)
                .map(async (call) => {
                  const recording = await this.pulseRecordingService
                    .download(
                      call.recording_url ?? call.voicemail_url ?? '',
                      client.authorizationHeader(),
                    )
                    .catch(() => null);

                  if (recording === null) {
                    return;
                  }

                  const isStored =
                    await this.pulseRecordingService.attachRecording({
                      workspaceId,
                      noteId: importedIds[call.id],
                      recording,
                      label: isNonEmptyString(call.recording_url)
                        ? 'Call recording'
                        : 'Voicemail',
                    });

                  if (isStored) {
                    importedIds[`${call.id}:recording`] = importedIds[call.id];
                  }
                }),
            );
          }
        };

        await importActivities<CloseNoteActivity>(
          'Notes',
          '/activity/note/',
          'notes',
          (note) => ({
            title: note.note?.split('\n')[0]?.slice(0, 80) || 'Note',
            markdown: note.note ?? '',
          }),
        );
        await importActivities<CloseCallActivity>(
          'Calls and recordings',
          '/activity/call/',
          'calls',
          buildCallNote,
          copyRecordings,
        );
        await importActivities<CloseEmailActivity>(
          'Emails',
          '/activity/email/',
          'emails',
          (email) => {
            const note = buildEmailNote(email);

            return {
              ...note,
              markdown: note.markdown.slice(0, EMAIL_BODY_MAX_LENGTH),
            };
          },
        );
        await importActivities<CloseSmsActivity>(
          'Texts',
          '/activity/sms/',
          'texts',
          buildSmsNote,
        );

        status.currentStep = 'Tasks';
        await saveProgress();

        for await (const tasks of client.paginate<CloseTask>('/task/', {
          _type: 'lead',
        })) {
          const newTasks = tasks.filter((task) => !importedIds[task.id]);
          const rows = newTasks.map((task) => ({
            id: v4(),
            title: (task.text ?? 'Follow up').slice(0, 250),
            dueAt: isNonEmptyString(task.date) ? new Date(task.date) : null,
            status: task.is_complete ? 'DONE' : 'TODO',
            position: nextPosition(),
            createdBy: IMPORTED_BY,
            updatedBy: IMPORTED_BY,
          }));

          if (rows.length > 0) {
            await taskRepository.insert(rows);

            const targets = newTasks.flatMap((task, index) => {
              const companyId = isNonEmptyString(task.lead_id)
                ? importedIds[task.lead_id]
                : undefined;
              const personId = isNonEmptyString(task.contact_id)
                ? importedIds[task.contact_id]
                : undefined;

              return [
                ...(isDefined(companyId)
                  ? [{ taskId: rows[index].id, targetCompanyId: companyId }]
                  : []),
                ...(isDefined(personId)
                  ? [{ taskId: rows[index].id, targetPersonId: personId }]
                  : []),
              ];
            });

            if (targets.length > 0) {
              await taskTargetRepository.insert(targets);
            }
          }

          newTasks.forEach((task, index) => {
            importedIds[task.id] = rows[index].id;
          });
          status.counts.tasks += rows.length;
          await saveProgress();
        }
      }, buildSystemAuthContext(workspaceId));

      // Stage fields created at the start can reach the record layer a moment late, which
      // silently dropped the stage on the first deals; a second pass re-places every deal.
      status.currentStep = 'Placing deals in pipelines';
      await saveProgress();

      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const opportunityRepository = this.workspaceOrmManager.getRepository(
          OpportunityWorkspaceEntity,
          { shouldBypassPermissionChecks: true },
          { shouldSkipEventEmission: true },
        );

        for await (const opportunities of client.paginate<CloseOpportunity>(
          '/opportunity/',
        )) {
          for (const opportunity of opportunities) {
            const dealId = dealIdFor(opportunity);

            if (isDefined(dealId)) {
              await opportunityRepository.update(
                { id: dealId },
                placement(opportunity),
              );
            }
          }
        }
      }, buildSystemAuthContext(workspaceId));

      status.state = 'done';
      status.currentStep = null;
    } catch (error) {
      this.logger.error(
        `Close import failed for workspace ${workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
      status.state = 'failed';
      status.error =
        error instanceof CloseApiError
          ? error.message
          : 'The import hit an error. Run it again to pick up where it stopped.';
    }

    status.finishedAt = new Date().toISOString();
    await saveProgress();
  }

  private async findIdsByUniqueValue(
    repository: WorkspaceRepository<ObjectLiteral>,
    compositeField: string,
    subField: string,
    values: (string | null)[],
  ): Promise<Map<string, string>> {
    const uniqueValues = [...new Set(values.filter(isNonEmptyString))];

    if (uniqueValues.length === 0) {
      return new Map();
    }

    const existing = await repository.find({
      where: { [compositeField]: { [subField]: In(uniqueValues) } },
      withDeleted: true,
    });

    const deletedIds = existing
      .filter((record) => isDefined(record.deletedAt))
      .map((record) => record.id);

    if (deletedIds.length > 0) {
      await repository.update({ id: In(deletedIds) }, { deletedAt: null });
    }

    return new Map(
      existing.map((record) => [record[compositeField][subField], record.id]),
    );
  }

  async startRemoval(workspaceId: string): Promise<CloseImportStatus> {
    const current = await this.getStatus(workspaceId);

    if (current.state === 'running') {
      throw new CloseImportAlreadyRunningError();
    }

    const status: CloseImportStatus = {
      ...current,
      state: 'running',
      currentStep: 'Removing imported data',
      error: null,
    };

    await this.saveStatus(workspaceId, status);
    await this.messageQueueService.add<{ workspaceId: string }>(
      'CloseImportRemovalJob',
      { workspaceId },
    );

    return status;
  }

  // Deletes every record the import created; records that existed before and were
  // only matched by website or email are left alone.
  async removeImportedData(workspaceId: string): Promise<void> {
    const status = await this.getStatus(workspaceId);

    try {
      await this.deleteImportedRecords(workspaceId, () =>
        this.saveStatus(workspaceId, status),
      );
      await this.deleteStored(workspaceId, IMPORTED_IDS_KEY);
      await this.deleteStored(workspaceId, STATUS_KEY);
    } catch (error) {
      this.logger.error(
        `Removing Close import failed for workspace ${workspaceId}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.saveStatus(workspaceId, {
        ...status,
        state: 'failed',
        error: 'Removing the imported data hit an error. Try again.',
      });
    }
  }

  private async deleteImportedRecords(
    workspaceId: string,
    onBatchDeleted: () => Promise<void>,
  ): Promise<void> {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const entities = [
        NoteWorkspaceEntity,
        TaskWorkspaceEntity,
        OpportunityWorkspaceEntity,
        PersonWorkspaceEntity,
        CompanyWorkspaceEntity,
      ];

      for (const entity of entities) {
        const repository =
          this.workspaceOrmManager.getRepository<ObjectLiteral>(
            entity,
            { shouldBypassPermissionChecks: true },
            { shouldSkipEventEmission: true },
          );

        for (;;) {
          const batch = await repository.find({
            where: {
              createdBy: {
                source: IMPORTED_BY.source,
                name: IMPORTED_BY.name,
              },
            },
            select: { id: true },
            take: REMOVAL_BATCH_SIZE,
            withDeleted: true,
          });

          if (batch.length === 0) {
            break;
          }

          await repository.delete({ id: In(batch.map(({ id }) => id)) });
          await onBatchDeleted();
        }
      }
    }, buildSystemAuthContext(workspaceId));
  }

  private async saveStatus(workspaceId: string, status: CloseImportStatus) {
    await this.writeStored<StoredCloseImportStatus>(workspaceId, STATUS_KEY, {
      ...status,
      heartbeatAt: Date.now(),
    });
  }

  private async readStored<TValue>(
    workspaceId: string,
    key: string,
  ): Promise<TValue | undefined> {
    const [stored] = await this.keyValuePairService.get({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key,
    });

    return stored?.value as TValue | undefined;
  }

  private async writeStored<TValue>(
    workspaceId: string,
    key: string,
    value: TValue,
  ): Promise<void> {
    await this.keyValuePairService.set({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key,
      value,
    });
  }

  private async deleteStored(workspaceId: string, key: string): Promise<void> {
    await this.keyValuePairService.delete({
      workspaceId,
      userId: null,
      type: KeyValuePairType.USER_VARIABLE,
      key,
    });
  }
}
