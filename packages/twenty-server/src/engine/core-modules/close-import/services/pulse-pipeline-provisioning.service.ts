import { Injectable } from '@nestjs/common';

import {
  AggregateOperations,
  FieldMetadataType,
  NavigationMenuItemType,
  ViewFilterOperand,
  ViewType,
  ViewVisibility,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import {
  makeUniqueName,
  toCamelCaseFieldName,
  toSelectOptionValue,
} from 'src/engine/core-modules/close-import/utils/close-import-mappers.util';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { NavigationMenuItemService } from 'src/engine/metadata-modules/navigation-menu-item/navigation-menu-item.service';
import { ViewFieldService } from 'src/engine/metadata-modules/view-field/services/view-field.service';
import { ViewFilterService } from 'src/engine/metadata-modules/view-filter/services/view-filter.service';
import { ViewService } from 'src/engine/metadata-modules/view/services/view.service';

export type PulseSelectOptionInput = {
  label: string;
  color: string;
};

type SelectOption = {
  id: string;
  label: string;
  value: string;
  color: string;
  position: number;
};

export const PULSE_PIPELINE_FIELD_NAME = 'pipeline';

const OPPORTUNITY_CARD_FIELD_NAMES = [
  'name',
  'amount',
  'company',
  'pointOfContact',
  'closeDate',
];

const normalizeLabel = (label: string) => label.trim().toLowerCase();

// Builds deal pipelines (and similar boards) the same way a user would in the UI:
// a select field for the stages, a kanban view grouped by it, and a sidebar entry.
@Injectable()
export class PulsePipelineProvisioningService {
  constructor(
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly viewService: ViewService,
    private readonly viewFieldService: ViewFieldService,
    private readonly viewFilterService: ViewFilterService,
    private readonly navigationMenuItemService: NavigationMenuItemService,
  ) {}

  // Returns the option value for each label, adding the options that are missing.
  async ensureSelectField({
    workspaceId,
    objectNameSingular,
    fieldName,
    label,
    icon,
    options,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    fieldName: string;
    label: string;
    icon: string;
    options: PulseSelectOptionInput[];
  }): Promise<{
    fieldId: string;
    isNew: boolean;
    valueByLabel: Map<string, string>;
  }> {
    const { objectMetadataId, fields } = await this.getObjectFields(
      workspaceId,
      objectNameSingular,
    );
    const existingField = fields.find((field) => field.name === fieldName);
    const existingOptions = ((existingField?.options ?? []) as SelectOption[])
      .filter(isDefined)
      .map(({ id, label, value, color, position }) => ({
        id,
        label,
        value,
        color,
        position,
      }));

    const allOptions = [...existingOptions];

    for (const option of options) {
      const alreadyThere = allOptions.some(
        (existing) =>
          normalizeLabel(existing.label) === normalizeLabel(option.label),
      );

      if (alreadyThere || option.label.trim().length === 0) {
        continue;
      }

      allOptions.push({
        id: v4(),
        label: option.label.trim(),
        value: makeUniqueName(
          toSelectOptionValue(option.label),
          allOptions.map((existing) => existing.value),
        ),
        color: option.color,
        position: allOptions.length,
      });
    }

    let fieldId = existingField?.id;

    if (!isDefined(fieldId)) {
      const createdField = await this.fieldMetadataService.createOneField({
        workspaceId,
        createFieldInput: {
          objectMetadataId,
          type: FieldMetadataType.SELECT,
          name: fieldName,
          label,
          icon,
          isNullable: true,
          options: allOptions,
        },
      });

      fieldId = createdField.id;
    } else if (allOptions.length > existingOptions.length) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        updateFieldInput: { id: fieldId, options: allOptions },
      });
    }

    return {
      fieldId,
      isNew: !isDefined(existingField),
      valueByLabel: new Map(
        allOptions.map((option) => [
          normalizeLabel(option.label),
          option.value,
        ]),
      ),
    };
  }

  async ensureOpportunityPipeline({
    workspaceId,
    name,
    stages,
  }: {
    workspaceId: string;
    name: string;
    stages: PulseSelectOptionInput[];
  }): Promise<{
    pipelineValue: string;
    stageFieldName: string;
    stageValueByLabel: Map<string, string>;
  }> {
    const pipelineField = await this.ensureSelectField({
      workspaceId,
      objectNameSingular: 'opportunity',
      fieldName: PULSE_PIPELINE_FIELD_NAME,
      label: 'Pipeline',
      icon: 'IconLayoutKanban',
      options: [{ label: name, color: 'purple' }],
    });

    if (pipelineField.isNew) {
      await this.hideNamedPipelineDealsFromDefaultBoards(
        workspaceId,
        pipelineField.fieldId,
      );
    }

    const stageFieldLabel = `${name} stage`;
    const { fields } = await this.getObjectFields(workspaceId, 'opportunity');
    const stageFieldName =
      fields.find(
        (field) =>
          normalizeLabel(field.label) === normalizeLabel(stageFieldLabel),
      )?.name ??
      makeUniqueName(
        `${toCamelCaseFieldName(name)}Stage`,
        fields.map((field) => field.name),
      );

    const stageField = await this.ensureSelectField({
      workspaceId,
      objectNameSingular: 'opportunity',
      fieldName: stageFieldName,
      label: stageFieldLabel,
      icon: 'IconProgress',
      options: stages,
    });

    const pipelineValue = pipelineField.valueByLabel.get(normalizeLabel(name));

    if (!isDefined(pipelineValue)) {
      throw new Error(`Pipeline option missing for ${name}`);
    }

    await this.ensureKanbanBoard({
      workspaceId,
      objectNameSingular: 'opportunity',
      name,
      groupByFieldId: stageField.fieldId,
      cardFieldNames: OPPORTUNITY_CARD_FIELD_NAMES,
      sumFieldName: 'amount',
      filter: {
        fieldId: pipelineField.fieldId,
        operand: ViewFilterOperand.IS,
        value: JSON.stringify([pipelineValue]),
      },
    });

    return {
      pipelineValue,
      stageFieldName,
      stageValueByLabel: stageField.valueByLabel,
    };
  }

  async ensureKanbanBoard({
    workspaceId,
    objectNameSingular,
    name,
    groupByFieldId,
    cardFieldNames,
    sumFieldName,
    filter,
  }: {
    workspaceId: string;
    objectNameSingular: string;
    name: string;
    groupByFieldId: string;
    cardFieldNames: string[];
    sumFieldName?: string;
    filter?: { fieldId: string; operand: ViewFilterOperand; value: string };
  }): Promise<string> {
    const { objectMetadataId, fields } = await this.getObjectFields(
      workspaceId,
      objectNameSingular,
    );
    const views = await this.getObjectViews(workspaceId, objectMetadataId);
    const existingView = views.find(
      (view) =>
        view.type === ViewType.KANBAN &&
        view.mainGroupByFieldMetadataId === groupByFieldId,
    );

    if (isDefined(existingView)) {
      return existingView.id;
    }

    const fieldIdByName = (fieldName: string) =>
      fields.find((field) => field.name === fieldName)?.id;

    const view = await this.viewService.createOne({
      workspaceId,
      createViewInput: {
        name,
        objectMetadataId,
        type: ViewType.KANBAN,
        icon: 'IconLayoutKanban',
        position: views.length,
        visibility: ViewVisibility.WORKSPACE,
        mainGroupByFieldMetadataId: groupByFieldId,
        ...(isDefined(sumFieldName) && isDefined(fieldIdByName(sumFieldName))
          ? {
              kanbanAggregateOperation: AggregateOperations.SUM,
              kanbanAggregateOperationFieldMetadataId:
                fieldIdByName(sumFieldName),
            }
          : {}),
      },
    });

    await this.viewFieldService.createMany({
      workspaceId,
      createViewFieldInputs: cardFieldNames
        .map(fieldIdByName)
        .filter(isDefined)
        .map((fieldMetadataId, index) => ({
          viewId: view.id,
          fieldMetadataId,
          position: index,
          isVisible: true,
          size: index === 0 ? 240 : 160,
        })),
    });

    if (isDefined(filter)) {
      await this.viewFilterService.createOne({
        workspaceId,
        createViewFilterInput: {
          viewId: view.id,
          fieldMetadataId: filter.fieldId,
          operand: filter.operand,
          value: filter.value,
        },
      });
    }

    await this.navigationMenuItemService.create({
      workspaceId,
      input: { type: NavigationMenuItemType.VIEW, viewId: view.id },
    });

    return view.id;
  }

  // The original deal boards keep only deals that are not in a named pipeline.
  private async hideNamedPipelineDealsFromDefaultBoards(
    workspaceId: string,
    pipelineFieldId: string,
  ) {
    const { objectMetadataId, fields } = await this.getObjectFields(
      workspaceId,
      'opportunity',
    );
    const stageFieldId = fields.find((field) => field.name === 'stage')?.id;
    const views = await this.getObjectViews(workspaceId, objectMetadataId);

    for (const view of views) {
      if (
        view.type === ViewType.KANBAN &&
        view.mainGroupByFieldMetadataId === stageFieldId
      ) {
        await this.viewFilterService.createOne({
          workspaceId,
          createViewFilterInput: {
            viewId: view.id,
            fieldMetadataId: pipelineFieldId,
            operand: ViewFilterOperand.IS_EMPTY,
            value: '',
          },
        });
      }
    }
  }

  private async getObjectFields(
    workspaceId: string,
    objectNameSingular: string,
  ) {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const objectMetadata = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).find((object) => object?.nameSingular === objectNameSingular);

    if (!isDefined(objectMetadata)) {
      throw new Error(`Object ${objectNameSingular} not found`);
    }

    return {
      objectMetadataId: objectMetadata.id,
      fields: Object.values(flatFieldMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .filter((field) => field.objectMetadataId === objectMetadata.id),
    };
  }

  private async getObjectViews(workspaceId: string, objectMetadataId: string) {
    const { flatViewMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatViewMaps'] },
      );

    return Object.values(flatViewMaps.byUniversalIdentifier)
      .filter(isDefined)
      .filter(
        (view) =>
          view.objectMetadataId === objectMetadataId &&
          !isDefined(view.deletedAt),
      );
  }
}
