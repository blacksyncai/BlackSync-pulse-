import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID, createHash } from 'crypto';
import { ILike, IsNull, Like, Repository } from 'typeorm';
import {
  FieldActorSource,
  FieldMetadataType,
  ViewFilterOperand,
  ViewType,
} from 'twenty-shared/types';
import { isDefined, parseJson } from 'twenty-shared/utils';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { fromUserEntityToFlat } from 'src/engine/core-modules/user/utils/from-user-entity-to-flat.util';
import { buildUserAuthContext } from 'src/engine/core-modules/auth/utils/build-user-auth-context.util';
import { type FlatWorkspace } from 'src/engine/core-modules/workspace/types/flat-workspace.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { type NoteTargetWorkspaceEntity } from 'src/modules/note/standard-objects/note-target.workspace-entity';
import {
  parsePulseFormDefinition,
  parsePulseFormAnswers,
  type StoredPulseForm,
  type PulseFormDefinition,
} from '../utils/pulse-form-definition';

const FORM_PREFIX = 'pulse-form:';
const RECEIPT_PREFIX = 'pulse-form-submission:';
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type FormPublisher = {
  workspaceId: string;
  userId: string;
  userWorkspaceId: string;
};

@Injectable()
export class PulseFormsService {
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly storage: Repository<KeyValuePairEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly memberships: Repository<UserWorkspaceEntity>,
    private readonly workspaceCache: WorkspaceCacheService,
    private readonly orm: WorkspaceOrmManager,
  ) {}

  async list(publisher: FormPublisher) {
    const rows = await this.storage.find({
      where: {
        workspaceId: publisher.workspaceId,
        userId: publisher.userId,
        type: KeyValuePairType.USER_VARIABLE,
        key: Like(`${FORM_PREFIX}%`),
        deletedAt: IsNull(),
      },
      order: { updatedAt: 'DESC' },
      take: 100,
    });
    return rows.map((row) => row.value as unknown as StoredPulseForm);
  }

  async save(
    publisher: FormPublisher,
    input: unknown,
    id?: string,
    revision?: number,
  ) {
    const definition = parsePulseFormDefinition(input);
    await this.publisherContext(publisher);
    await this.routing(publisher.workspaceId, definition);
    if (id && !uuidPattern.test(id))
      throw new BadRequestException('Invalid form ID.');
    const formId = id ?? randomUUID();
    return this.storage.manager.transaction(async (manager) => {
      const repository = manager.getRepository(KeyValuePairEntity);
      const existing = await repository.findOne({
        where: { key: `${FORM_PREFIX}${formId}`, deletedAt: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        id &&
        (!existing ||
          existing.workspaceId !== publisher.workspaceId ||
          existing.userId !== publisher.userId)
      )
        throw new NotFoundException('Form not found.');
      const previous = existing?.value as unknown as
        StoredPulseForm | undefined;
      if (existing && previous?.revision !== revision)
        throw new ConflictException(
          'This form changed. Reload it before saving.',
        );
      const form: StoredPulseForm = {
        ...definition,
        id: formId,
        userWorkspaceId: publisher.userWorkspaceId,
        revision: (previous?.revision ?? 0) + 1,
      };
      await repository.save({
        ...existing,
        key: `${FORM_PREFIX}${formId}`,
        workspaceId: publisher.workspaceId,
        userId: publisher.userId,
        applicationId: null,
        type: KeyValuePairType.USER_VARIABLE,
        value: form as unknown as JSON,
      });
      return form;
    });
  }

  async publicForm(id: string) {
    if (!uuidPattern.test(id)) throw new NotFoundException('Form unavailable.');
    const row = await this.storage.findOne({
      where: {
        key: `${FORM_PREFIX}${id}`,
        type: KeyValuePairType.USER_VARIABLE,
        deletedAt: IsNull(),
      },
    });
    const form = row?.value as unknown as StoredPulseForm | undefined;
    if (!row || !form?.published || !row.workspaceId || !row.userId)
      throw new NotFoundException('Form unavailable.');
    return { row, form };
  }

  private async publisherContext(publisher: FormPublisher) {
    const membership = await this.memberships.findOne({
      where: {
        id: publisher.userWorkspaceId,
        userId: publisher.userId,
        workspaceId: publisher.workspaceId,
      },
    });
    const user = await this.users.findOne({ where: { id: publisher.userId } });
    const { flatWorkspaceMemberMaps } =
      await this.workspaceCache.getOrRecompute(publisher.workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);
    const workspaceMemberId =
      flatWorkspaceMemberMaps.idByUserId[publisher.userId];
    const workspaceMember = workspaceMemberId
      ? flatWorkspaceMemberMaps.byId[workspaceMemberId]
      : undefined;
    if (!membership || !user || !workspaceMemberId || !workspaceMember)
      throw new ForbiddenException(
        'The publishing member is no longer available.',
      );
    return buildUserAuthContext({
      workspace: { id: publisher.workspaceId } as FlatWorkspace,
      userWorkspaceId: publisher.userWorkspaceId,
      user: fromUserEntityToFlat(user),
      workspaceMemberId,
      workspaceMember,
    });
  }

  private async routing(workspaceId: string, form: PulseFormDefinition) {
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatViewMaps,
      flatViewFilterMaps,
    } = await this.workspaceCache.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatViewMaps',
      'flatViewFilterMaps',
    ]);
    const objects = Object.values(flatObjectMetadataMaps.byId).filter(
      isDefined,
    );
    const company = objects.find((object) => object.nameSingular === 'company');
    const opportunity = objects.find(
      (object) => object.nameSingular === 'opportunity',
    );
    const fields = Object.values(flatFieldMetadataMaps.byId).filter(isDefined);
    if (form.pondValue) {
      const pond = fields.find(
        (field) =>
          field.objectMetadataId === company?.id &&
          field.name === 'leadPond' &&
          field.isActive &&
          field.type === FieldMetadataType.SELECT,
      );
      if (!pond?.options?.some((option) => option.value === form.pondValue))
        throw new BadRequestException('The selected pond no longer exists.');
    }
    if (!form.pipelineViewId) return null;
    const view = flatViewMaps.byId[form.pipelineViewId];
    const stage = fields.find(
      (field) =>
        field.id === view?.mainGroupByFieldMetadataId &&
        field.objectMetadataId === opportunity?.id &&
        field.isActive &&
        field.type === FieldMetadataType.SELECT,
    );
    if (
      !view ||
      view.type !== ViewType.KANBAN ||
      view.objectMetadataId !== opportunity?.id ||
      !stage?.options?.some((option) => option.value === form.stageValue)
    )
      throw new BadRequestException(
        'The selected pipeline or stage no longer exists.',
      );
    const pipelineField = fields.find(
      (field) =>
        field.objectMetadataId === opportunity?.id &&
        field.name === 'pipeline' &&
        field.type === FieldMetadataType.SELECT,
    );
    const filter = Object.values(flatViewFilterMaps.byId)
      .filter(isDefined)
      .find(
        (filter) =>
          filter.viewId === view.id &&
          filter.fieldMetadataId === pipelineField?.id &&
          filter.operand === ViewFilterOperand.IS,
      );
    const additionalFilters = Object.values(flatViewFilterMaps.byId)
      .filter(isDefined)
      .filter(
        (candidate) =>
          candidate.viewId === view.id && candidate.id !== filter?.id,
      );
    if (additionalFilters.length > 0)
      throw new BadRequestException(
        'Choose a pipeline board without additional filters for form routing.',
      );
    const pipelineValue = filter
      ? parseJson<string[]>(
          typeof filter.value === 'string'
            ? filter.value
            : JSON.stringify(filter.value),
        )?.[0]
      : null;
    if (
      pipelineValue &&
      !pipelineField?.options?.some((option) => option.value === pipelineValue)
    )
      throw new BadRequestException('The pipeline destination is unavailable.');
    return { stageFieldName: stage.name, pipelineValue };
  }

  async submit(id: string, submissionId: string, input: unknown) {
    if (!uuidPattern.test(submissionId))
      throw new BadRequestException('Reload the form before submitting.');
    const { row, form } = await this.publicForm(id);
    const answers = parsePulseFormAnswers(form, input);
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(answers))
      .digest('hex');
    const publisher = {
      workspaceId: row.workspaceId!,
      userId: row.userId!,
      userWorkspaceId: form.userWorkspaceId,
    };
    const context = await this.publisherContext(publisher);
    const receiptKey = `${RECEIPT_PREFIX}${id}:${submissionId}`;
    return this.orm.executeInWorkspaceContext(
      () =>
        this.orm.runInWorkspaceTransaction(async (transaction) => {
          await transaction.executeRawQuery(
            'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
            [receiptKey],
          );
          const receipts = await transaction.executeRawQuery(
            'SELECT value FROM core."keyValuePair" WHERE key = $1 AND "workspaceId" = $2 AND type = $3 AND "deletedAt" IS NULL',
            [receiptKey, publisher.workspaceId, KeyValuePairType.USER_VARIABLE],
          );
          if (receipts.length) {
            const receipt = receipts[0].value as { fingerprint: string };
            if (receipt.fingerprint !== fingerprint)
              throw new ConflictException(
                'Submission ID already used. Reload the form.',
              );
            return { success: true };
          }
          const current = await transaction.executeRawQuery(
            'SELECT value FROM core."keyValuePair" WHERE id = $1 AND "workspaceId" = $2 AND "deletedAt" IS NULL FOR SHARE',
            [row.id, publisher.workspaceId],
          );
          const liveForm = current[0]?.value as StoredPulseForm | undefined;
          if (!liveForm?.published || liveForm.revision !== form.revision)
            throw new ConflictException(
              'The form changed. Reload it before submitting.',
            );
          const routing = await this.routing(publisher.workspaceId, form);
          const people =
            this.orm.getRepositoryWithContextPermissions<PersonWorkspaceEntity>(
              'person',
              transaction,
            );
          const companies =
            this.orm.getRepositoryWithContextPermissions<CompanyWorkspaceEntity>(
              'company',
              transaction,
            );
          const opportunities =
            this.orm.getRepositoryWithContextPermissions<OpportunityWorkspaceEntity>(
              'opportunity',
              transaction,
            );
          const notes =
            this.orm.getRepositoryWithContextPermissions<NoteWorkspaceEntity>(
              'note',
              transaction,
            );
          const targets =
            this.orm.getRepositoryWithContextPermissions<NoteTargetWorkspaceEntity>(
              'noteTarget',
              transaction,
            );
          const actor = {
            source: FieldActorSource.WEBHOOK,
            name: `Form: ${form.title}`,
            workspaceMemberId: null,
            context: {},
          };
          const fullName =
            [answers.firstName, answers.lastName].filter(Boolean).join(' ') ||
            answers.email ||
            answers.phone ||
            form.title;
          // Serialize matching contacts as well as browser retries; never guess between duplicate contacts.
          if (answers.email)
            await transaction.executeRawQuery(
              'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
              [
                `pulse-form-email:${publisher.workspaceId}:${answers.email.toLowerCase()}`,
              ],
            );
          const matches = answers.email
            ? await people.find({
                where: {
                  emails: {
                    primaryEmail: ILike(
                      answers.email.replace(
                        /[\\%_]/g,
                        (character) => `\\${character}`,
                      ),
                    ),
                  },
                },
                take: 2,
              })
            : [];
          if (matches.length > 1)
            throw new BadRequestException(
              'We could not process this submission. Please contact the business directly.',
            );
          const existing = matches[0];
          const companyId = existing?.companyId ?? randomUUID();
          if (existing?.companyId) {
            const company = await companies.findOne({
              where: { id: companyId },
            });
            if (!company)
              throw new BadRequestException(
                'Submission destination is unavailable.',
              );
          } else {
            await companies.insert({
              id: companyId,
              name: answers.company || fullName,
              accountOwnerId: null,
              ...(form.pondValue ? { leadPond: form.pondValue } : {}),
              position: Date.now(),
              createdBy: actor,
              updatedBy: actor,
            });
          }
          const personId = existing?.id ?? randomUUID();
          if (!existing)
            await people.insert({
              id: personId,
              name: {
                firstName: answers.firstName || '',
                lastName: answers.lastName || '',
              },
              companyId,
              emails: {
                primaryEmail: answers.email?.toLowerCase() || '',
                additionalEmails: [],
              },
              ...(answers.phone
                ? {
                    phones: {
                      primaryPhoneNumber: answers.phone.replace(/[\s()-]/g, ''),
                      primaryPhoneCallingCode: '',
                      primaryPhoneCountryCode: '',
                      additionalPhones: [],
                    },
                  }
                : {}),
              position: Date.now(),
              createdBy: actor,
              updatedBy: actor,
            });
          // Existing contacts keep their company, owner, pond and deal stages; new inquiries may create a new deal.
          const opportunityId = routing ? randomUUID() : null;
          if (routing && opportunityId)
            await opportunities.insert({
              id: opportunityId,
              name: `${fullName} · ${form.title}`.slice(0, 250),
              companyId,
              pointOfContactId: personId,
              ownerId: null,
              [routing.stageFieldName]: form.stageValue,
              ...(routing.pipelineValue
                ? { pipeline: routing.pipelineValue }
                : {}),
              position: Date.now(),
              createdBy: actor,
              updatedBy: actor,
            });
          const noteId = randomUUID();
          const markdown = form.fields
            .map((field) => `${field.label}:\n${answers[field.key] ?? ''}`)
            .join('\n\n');
          await notes.insert({
            id: noteId,
            title: `Form submission · ${form.title}`,
            bodyV2: await transformRichTextValue({ markdown, blocknote: null }),
            position: Date.now(),
            createdBy: actor,
            updatedBy: actor,
          });
          await targets.insert([
            { noteId, targetPersonId: personId },
            { noteId, targetCompanyId: companyId },
            ...(opportunityId
              ? [{ noteId, targetOpportunityId: opportunityId }]
              : []),
          ]);
          await transaction.executeRawQuery(
            'INSERT INTO core."keyValuePair" (id, key, value, type, "workspaceId", "userId", "applicationId") VALUES ($1, $2, $3::jsonb, $4, $5, NULL, NULL)',
            [
              randomUUID(),
              receiptKey,
              JSON.stringify({
                fingerprint,
                formId: id,
                companyId,
                personId,
                opportunityId,
                noteId,
                submittedAt: new Date().toISOString(),
              }),
              KeyValuePairType.USER_VARIABLE,
              publisher.workspaceId,
            ],
          );
          return { success: true };
        }),
      context,
    );
  }

  async submissions(publisher: FormPublisher, id: string) {
    const forms = await this.list(publisher);
    if (!forms.some((form) => form.id === id))
      throw new NotFoundException('Form not found.');
    const rows = await this.storage.find({
      where: {
        workspaceId: publisher.workspaceId,
        userId: IsNull(),
        type: KeyValuePairType.USER_VARIABLE,
        key: Like(`${RECEIPT_PREFIX}${id}:%`),
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((row) => {
      const value = row.value as unknown as Record<string, unknown>;
      return {
        submittedAt: value.submittedAt,
        companyId: value.companyId,
        personId: value.personId,
        opportunityId: value.opportunityId,
        noteId: value.noteId,
      };
    });
  }
}
