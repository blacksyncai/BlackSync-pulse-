import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import {
  CoreObjectNameSingular,
  FieldMetadataType,
  ViewType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type PulsePipeline = {
  viewId: string;
  name: string;
  isDefault: boolean;
  stages: { label: string; color: string }[];
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

    return [
      {
        viewId: view.id,
        name: view.name,
        isDefault: groupByField.name === 'stage',
        stages: [...(groupByField.options ?? [])]
          .sort((a, b) => a.position - b.position)
          .map((option) => ({ label: option.label, color: option.color })),
      },
    ];
  });

  return { pipelines, opportunityMetadataItem: objectMetadataItem };
};
