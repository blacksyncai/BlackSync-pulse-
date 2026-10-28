import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { InjectCacheStorage } from 'src/engine/core-modules/cache-storage/decorators/cache-storage.decorator';
import { CacheStorageService } from 'src/engine/core-modules/cache-storage/services/cache-storage.service';
import { CacheStorageNamespace } from 'src/engine/core-modules/cache-storage/types/cache-storage-namespace.enum';
import {
  CloseApiClient,
  CloseApiError,
} from 'src/engine/core-modules/close-import/services/close-api.client';
import {
  type CloseActivityBase,
  type CloseCallActivity,
  type CloseEmailActivity,
  type CloseLead,
  type CloseNoteActivity,
  type CloseOpportunity,
  type CloseSmsActivity,
  type CloseTask,
} from 'src/engine/core-modules/close-import/types/close-api.type';
import {
  type CloseImportCounts,
  type CloseImportJobData,
  type CloseImportStatus,
} from 'src/engine/core-modules/close-import/types/close-import-status.type';
import {
  buildCallNote,
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
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import { NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { TaskTargetWorkspaceEntity } from 'src/modules/task/standard-objects/task-target.workspace-entity';
import { TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';

const STATUS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const IMPORTED_IDS_TTL_MS = 365 * 24 * 60 * 60 * 1000;
// A running import refreshes its status at least this often; older means the worker died.
const STALE_RUN_MS = 15 * 60 * 1000;
const EMAIL_BODY_MAX_LENGTH = 20_000;

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
    @InjectCacheStorage(CacheStorageNamespace.EngineWorkspace)
    private readonly cacheStorage: CacheStorageService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async getStatus(workspaceId: string): Promise<CloseImportStatus> {
    const stored = await this.cacheStorage.get<StoredCloseImportStatus>(
      this.statusKey(workspaceId),
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

  async start(workspaceId: string, apiKey: string): Promise<CloseImportStatus> {
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
    });

    return status;
  }

  async run({
    workspaceId,
    apiKey,
    organizationName,
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
      (await this.cacheStorage.get<Record<string, string>>(
        this.idsKey(workspaceId),
      )) ?? {};

    const saveProgress = async () => {
      await this.saveStatus(workspaceId, status);
      await this.cacheStorage.set(
        this.idsKey(workspaceId),
        importedIds,
        IMPORTED_IDS_TTL_MS,
      );
    };

    try {
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

          const companies = newLeads.map((lead) => ({
            id: v4(),
            name: lead.display_name || 'Untitled account',
            domainName: mapCloseLeadDomain(lead.url),
            address: mapCloseLeadAddress(lead),
            position: nextPosition(),
            createdBy: IMPORTED_BY,
            updatedBy: IMPORTED_BY,
          }));

          if (companies.length > 0) {
            await companyRepository.insert(companies);
          }

          newLeads.forEach((lead, index) => {
            importedIds[lead.id] = companies[index].id;
          });
          status.counts.companies += companies.length;

          const people = leads.flatMap((lead) =>
            (lead.contacts ?? [])
              .filter((contact) => !importedIds[contact.id])
              .map((contact) => ({
                closeId: contact.id,
                row: {
                  id: v4(),
                  name: splitFullName(contact.name),
                  jobTitle: contact.title ?? '',
                  emails: mapCloseEmails(contact.emails ?? []),
                  phones: mapClosePhones(contact.phones ?? []),
                  companyId: importedIds[lead.id],
                  position: nextPosition(),
                  createdBy: IMPORTED_BY,
                  updatedBy: IMPORTED_BY,
                },
              })),
          );

          if (people.length > 0) {
            await personRepository.insert(people.map(({ row }) => row));
          }

          people.forEach(({ closeId, row }) => {
            importedIds[closeId] = row.id;
          });
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
          const newOpportunities = opportunities.filter(
            (opportunity) => !importedIds[opportunity.id],
          );
          const lost = newOpportunities.filter(
            (opportunity) => opportunity.status_type === 'lost',
          );
          const open = newOpportunities.filter(
            (opportunity) => opportunity.status_type !== 'lost',
          );

          const rows = open.map((opportunity) => ({
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
            stage: mapCloseOpportunityStage(opportunity),
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

          open.forEach((opportunity, index) => {
            importedIds[opportunity.id] = rows[index].id;
          });
          status.counts.opportunities += rows.length;

          // Pulse pipelines have no lost stage, so lost deals are kept as history on the account.
          await insertNotes(
            lost.map((opportunity) => ({
              closeId: opportunity.id,
              note: {
                title: `Lost deal: $${((opportunity.value ?? 0) / 100).toLocaleString('en-US')}`,
                markdown: [
                  isNonEmptyString(opportunity.status_label)
                    ? `Status: ${opportunity.status_label}`
                    : null,
                  opportunity.note,
                ]
                  .filter(isNonEmptyString)
                  .join('\n\n'),
              },
              createdAt: null,
              companyId: importedIds[opportunity.lead_id],
              personId: undefined,
            })),
          );

          await saveProgress();
        }

        const importActivities = async <TActivity extends CloseActivityBase>(
          step: string,
          path: string,
          countKey: keyof CloseImportCounts,
          toNote: (activity: TActivity) => ActivityNote,
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
            await saveProgress();
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
          'Calls',
          '/activity/call/',
          'calls',
          buildCallNote,
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

  private async saveStatus(workspaceId: string, status: CloseImportStatus) {
    await this.cacheStorage.set<StoredCloseImportStatus>(
      this.statusKey(workspaceId),
      { ...status, heartbeatAt: Date.now() },
      STATUS_TTL_MS,
    );
  }

  private statusKey(workspaceId: string) {
    return `close-import:status:${workspaceId}`;
  }

  private idsKey(workspaceId: string) {
    return `close-import:ids:${workspaceId}`;
  }
}
