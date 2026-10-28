import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import {
  CoreObjectNameSingular,
  FieldMetadataType,
  ViewFilterOperand,
  ViewType,
} from 'twenty-shared/types';
import { isDefined, parseJson } from 'twenty-shared/utils';

export type PulsePipelineStage = {
  label: string;
  value: string;
  color: string;
};

export type PulsePipeline = {
  viewId: string;
  name: string;
  isDefault: boolean;
  // Option value of the opportunity "pipeline" field; null for the original board.
  pipelineValue: string | null;
  stageFieldName: string;
  stages: PulsePipelineStage[];
};

// A pipeline is a deal board: a kanban view on opportunities grouped by a select field.
export const usePulsePipelines = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });

  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: objectMetadataItem.id },
  );

  const pipelineField = objectMetadataItem.fields.find(
    (field) => field.name === 'pipeline',
  );

  const pipelines: PulsePipeline[] = views.flatMap((view) => {
    if (view.type !== ViewType.KANBAN) {
      return [];
    }

    const groupByField = objectMetadataItem.fields.find(
      (field) => field.id === view.mainGroupByFieldMetadataId,
    );

    if (
      !isDefined(groupByField) ||
      groupByField.type !== FieldMetadataType.SELECT
    ) {
      return [];
    }

    const pipelineFilter = view.viewFilters.find(
      (filter) =>
        filter.fieldMetadataId === pipelineField?.id &&
        filter.operand === ViewFilterOperand.IS,
    );
    const pipelineValue = isDefined(pipelineFilter)
      ? (parseJson<string[]>(pipelineFilter.value)?.[0] ?? null)
      : null;

    return [
      {
        viewId: view.id,
        name: view.name,
        isDefault: groupByField.name === 'stage',
        pipelineValue,
        stageFieldName: groupByField.name,
        stages: [...(groupByField.options ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((option) => ({
            label: option.label,
            value: option.value,
            color: option.color,
          })),
      },
    ];
  });

  return { pipelines, opportunityMetadataItem: objectMetadataItem };
};
