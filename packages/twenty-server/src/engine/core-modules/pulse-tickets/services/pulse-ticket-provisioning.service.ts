import { v4 } from 'uuid';
import { type CreateFieldInput } from 'src/engine/metadata-modules/field-metadata/dtos/create-field.input';
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
      maps = await metadata();
      const existingFields = Object.values(
        maps.flatFieldMetadataMaps.byUniversalIdentifier,
      ).filter((field) => field?.objectMetadataId === objectMetadataId);
      const inputs: Omit<CreateFieldInput, 'workspaceId'>[] = [];
      const addField = (
        name: string,
        label: string,
        type: FieldMetadataType,
        target?: string,
      ) => {
        if (existingFields.some((field) => field?.name === name)) return;
        const targetObject = target
          ? Object.values(
              maps.flatObjectMetadataMaps.byUniversalIdentifier,
            ).find((item) => item?.nameSingular === target)
          : undefined;
        if (target && !targetObject)
          throw new Error(`Missing ticket relation target: ${target}`);
        inputs.push({
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
        });
      };
      addField('description', 'Description', FieldMetadataType.TEXT);
      addField('project', 'Project', FieldMetadataType.TEXT);
      addField('dueAt', 'Due date', FieldMetadataType.DATE_TIME);
      addField('client', 'Client', FieldMetadataType.RELATION, 'company');
      addField(
        'assignee',
        'Assignee',
        FieldMetadataType.RELATION,
        'workspaceMember',
      );
      addField('sourceMessageId', 'Source message ID', FieldMetadataType.UUID);
      addField('sourceThreadId', 'Source thread ID', FieldMetadataType.UUID);
      const addSelect = (
        name: string,
        label: string,
        defaultValue: string,
        options: [string, string, string][],
      ) => {
        if (existingFields.some((field) => field?.name === name)) return;
        inputs.push({
          objectMetadataId,
          name,
          label,
          type: FieldMetadataType.SELECT,
          isNullable: true,
          defaultValue: `'${defaultValue}'`,
          options: options.map(([value, optionLabel, color], position) => ({
            id: v4(),
            value,
            label: optionLabel,
            color,
            position,
          })),
        });
      };
      addSelect('status', 'Status', 'NEW', [
        ['NEW', 'New', 'blue'],
        ['TO_DO', 'To do', 'gray'],
        ['IN_PROGRESS', 'In progress', 'orange'],
        ['WAITING_ON_CLIENT', 'Waiting on client', 'purple'],
        ['DONE', 'Done', 'green'],
      ]);
      addSelect('priority', 'Priority', 'NORMAL', [
        ['LOW', 'Low', 'gray'],
        ['NORMAL', 'Normal', 'blue'],
        ['HIGH', 'High', 'orange'],
        ['URGENT', 'Urgent', 'red'],
      ]);
      addSelect('source', 'Source', 'MANUAL', [
        ['MANUAL', 'Manual', 'gray'],
        ['EMAIL', 'Email', 'blue'],
        ['MCP', 'MCP', 'purple'],
      ]);
      // One metadata migration for all fields, instead of rebuilding the workspace schema per field.
      const createdFields = inputs.length
        ? await this.fields.createManyFields({
            workspaceId,
            createFieldInputs: inputs,
          })
        : [];
      const status = [...existingFields, ...createdFields].find(
        (field) => field?.name === 'status',
      );
      if (!status)
        throw new Error(
          'Client ticket status field is unavailable. Retry setup.',
        );
      const viewId = await this.boards.ensureKanbanBoard({
        workspaceId,
        userWorkspaceId,
        objectNameSingular: 'clientTicket',
        name: 'Client tickets',
        groupByFieldId: status.id,
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
