import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';
import { PermissionFlagType } from 'twenty-shared/constants';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { PulsePipelineProvisioningService } from 'src/engine/core-modules/close-import/services/pulse-pipeline-provisioning.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';

const BOARD_KEY = 'pulse-client-tickets:v1';
const DESCRIPTION =
  'BlackSync client delivery tickets. Separate from sales opportunities and personal tasks.';

@Injectable()
export class PulseTicketProvisioningService {
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly storage: Repository<KeyValuePairEntity>,
    private readonly objects: ObjectMetadataService,
    private readonly fields: FieldMetadataService,
    private readonly cache: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly boards: PulsePipelineProvisioningService,
    private readonly permissions: PermissionsService,
  ) {}

  async state(workspaceId: string) {
    const entry = await this.storage.findOne({
      where: {
        key: BOARD_KEY,
        workspaceId,
        userId: IsNull(),
        applicationId: IsNull(),
        deletedAt: IsNull(),
      },
    });
    return entry?.value ?? null;
  }

  async setup(workspaceId: string, userWorkspaceId: string) {
    if (
      !(await this.permissions.userHasWorkspaceSettingPermission({
        workspaceId,
        userWorkspaceId,
        setting: PermissionFlagType.DATA_MODEL,
      }))
    )
      throw new ForbiddenException(
        'A workspace administrator must enable Client Tickets.',
      );
    // Metadata writes use their own migrations; serialize setup requests around them.
    return this.storage.manager.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`pulse-ticket-setup:${workspaceId}`],
      );
      const metadata = () =>
        this.cache.getOrRecomputeManyOrAllFlatEntityMaps({
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        });
      let maps = await metadata();
      let object = Object.values(
        maps.flatObjectMetadataMaps.byUniversalIdentifier,
      ).find((item) => item?.nameSingular === 'clientTicket');
      if (object && object.description !== DESCRIPTION)
        throw new ForbiddenException(
          'An existing clientTicket object needs administrator review before setup.',
        );
      if (!object)
        object = await this.objects.createOneObject({
          workspaceId,
          createObjectInput: {
            nameSingular: 'clientTicket',
            namePlural: 'clientTickets',
            labelSingular: 'Client ticket',
            labelPlural: 'Client tickets',
            description: DESCRIPTION,
            icon: 'IconCheckbox',
          },
        });
      const objectMetadataId = object.id;
      const addField = async (
        name: string,
        label: string,
        type: FieldMetadataType,
        target?: string,
      ) => {
        maps = await metadata();
        if (
          Object.values(maps.flatFieldMetadataMaps.byUniversalIdentifier).some(
            (field) =>
              field?.objectMetadataId === objectMetadataId &&
              field.name === name,
          )
        )
          return;
        const targetObject = target
          ? Object.values(
              maps.flatObjectMetadataMaps.byUniversalIdentifier,
            ).find((item) => item?.nameSingular === target)
          : undefined;
        if (target && !targetObject)
          throw new Error(`Missing ticket relation target: ${target}`);
        await this.fields.createOneField({
          workspaceId,
          createFieldInput: {
            objectMetadataId,
            name,
            label,
            type,
            isNullable: true,
            ...(targetObject
              ? {
                  relationCreationPayload: {
                    type: RelationType.MANY_TO_ONE,
                    targetObjectMetadataId: targetObject.id,
                    targetFieldLabel: 'Client tickets',
                    targetFieldIcon: 'IconCheckbox',
                  },
                }
              : {}),
          },
        });
      };
      await addField('description', 'Description', FieldMetadataType.TEXT);
      await addField('project', 'Project', FieldMetadataType.TEXT);
      await addField('dueAt', 'Due date', FieldMetadataType.DATE_TIME);
      await addField('client', 'Client', FieldMetadataType.RELATION, 'company');
      await addField(
        'assignee',
        'Assignee',
        FieldMetadataType.RELATION,
        'workspaceMember',
      );
      await addField(
        'sourceMessageId',
        'Source message ID',
        FieldMetadataType.UUID,
      );
      await addField(
        'sourceThreadId',
        'Source thread ID',
        FieldMetadataType.UUID,
      );
      const status = await this.boards.ensureSelectField({
        workspaceId,
        objectNameSingular: 'clientTicket',
        fieldName: 'status',
        label: 'Status',
        icon: 'IconCheckbox',
        options: [
          { label: 'New', color: 'blue' },
          { label: 'To do', color: 'gray' },
          { label: 'In progress', color: 'orange' },
          { label: 'Waiting on client', color: 'purple' },
          { label: 'Done', color: 'green' },
        ],
      });
      const priority = await this.boards.ensureSelectField({
        workspaceId,
        objectNameSingular: 'clientTicket',
        fieldName: 'priority',
        label: 'Priority',
        icon: 'IconFlag',
        options: [
          { label: 'Low', color: 'gray' },
          { label: 'Normal', color: 'blue' },
          { label: 'High', color: 'orange' },
          { label: 'Urgent', color: 'red' },
        ],
      });
      const source = await this.boards.ensureSelectField({
        workspaceId,
        objectNameSingular: 'clientTicket',
        fieldName: 'source',
        label: 'Source',
        icon: 'IconInbox',
        options: [
          { label: 'Manual', color: 'gray' },
          { label: 'Email', color: 'blue' },
          { label: 'MCP', color: 'purple' },
        ],
      });
      await this.fields.updateOneField({
        workspaceId,
        updateFieldInput: { id: status.fieldId, defaultValue: "'NEW'" },
      });
      await this.fields.updateOneField({
        workspaceId,
        updateFieldInput: { id: priority.fieldId, defaultValue: "'NORMAL'" },
      });
      await this.fields.updateOneField({
        workspaceId,
        updateFieldInput: { id: source.fieldId, defaultValue: "'MANUAL'" },
      });
      const viewId = await this.boards.ensureKanbanBoard({
        workspaceId,
        userWorkspaceId,
        objectNameSingular: 'clientTicket',
        name: 'Client tickets',
        groupByFieldId: status.fieldId,
        cardFieldNames: [
          'name',
          'client',
          'assignee',
          'priority',
          'dueAt',
          'project',
          'source',
        ],
      });
      const value = {
        objectMetadataId,
        viewId,
        href: `/objects/clientTickets?viewId=${viewId}`,
      };
      const repository = manager.getRepository(KeyValuePairEntity);
      const existing = await repository.findOne({
        where: {
          key: BOARD_KEY,
          workspaceId,
          userId: IsNull(),
          applicationId: IsNull(),
        },
      });
      await repository.save(
        repository.create({
          ...existing,
          key: BOARD_KEY,
          workspaceId,
          userId: null,
          applicationId: null,
          type: KeyValuePairType.USER_VARIABLE,
          value: value as unknown as JSON,
          deletedAt: null,
        }),
      );
      return value;
    });
  }
}
