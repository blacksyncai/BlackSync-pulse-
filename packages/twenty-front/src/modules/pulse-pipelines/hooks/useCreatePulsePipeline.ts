import {
  PULSE_CREATE_FIELD,
  PULSE_CREATE_NAVIGATION_MENU_ITEM,
  PULSE_CREATE_VIEW,
  PULSE_CREATE_VIEW_FIELDS,
  PULSE_CREATE_VIEW_FILTER,
  PULSE_UPDATE_FIELD,
} from '@/pulse-pipelines/graphql/pulsePipelineMutations';
import { usePulsePipelines } from '@/pulse-pipelines/hooks/usePulsePipelines';
import {
  buildStageOptions,
  makeUnique,
  toCamelCaseFieldName,
  toSelectOptionValue,
} from '@/pulse-pipelines/utils/buildPulsePipelineIdentifiers';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { viewsFromObjectMetadataItemFamilySelector } from '@/views/states/selectors/viewsFromObjectMetadataItemFamilySelector';
import { useApolloClient } from '@apollo/client/react';
import { useState } from 'react';
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

const PIPELINE_FIELD_NAME = 'pipeline';
const CARD_FIELD_NAMES = [
  'name',
  'amount',
  'company',
  'pointOfContact',
  'closeDate',
];

export const useCreatePulsePipeline = () => {
  const apolloClient = useApolloClient();
  const { opportunityMetadataItem } = usePulsePipelines();
  const views = useAtomFamilySelectorValue(
    viewsFromObjectMetadataItemFamilySelector,
    { objectMetadataItemId: opportunityMetadataItem.id },
  );
  const [isCreating, setIsCreating] = useState(false);

  const createPulsePipeline = async ({
    name,
    stages,
  }: {
    name: string;
    stages: string[];
  }): Promise<string> => {
    setIsCreating(true);

    try {
      const fields = opportunityMetadataItem.fields;
      const fieldByName = (fieldName: string) =>
        fields.find((field) => field.name === fieldName);
      const takenFieldNames = fields.map((field) => field.name);

      const existingPipelineField = fieldByName(PIPELINE_FIELD_NAME);
      const existingPipelineOptions = (
        existingPipelineField?.options ?? []
      ).map(({ id, label, value, color, position }) => ({
        id,
        label,
        value,
        color,
        position,
      }));
      const pipelineOption = {
        id: v4(),
        label: name,
        value: makeUnique(
          toSelectOptionValue(name),
          existingPipelineOptions.map((option) => option.value),
        ),
        color: 'purple',
        position: existingPipelineOptions.length,
      };

      // Every deal belongs to at most one pipeline; boards filter on it so deals never show twice.
      let pipelineFieldId = existingPipelineField?.id;

      if (isDefined(pipelineFieldId)) {
        await apolloClient.mutate({
          mutation: PULSE_UPDATE_FIELD,
          variables: {
            input: {
              id: pipelineFieldId,
              update: {
                options: [...existingPipelineOptions, pipelineOption],
              },
            },
          },
        });
      } else {
        const { data } = await apolloClient.mutate<{
          createOneField: { id: string };
        }>({
          mutation: PULSE_CREATE_FIELD,
          variables: {
            input: {
              field: {
                objectMetadataId: opportunityMetadataItem.id,
                type: FieldMetadataType.SELECT,
                name: PIPELINE_FIELD_NAME,
                label: 'Pipeline',
                icon: 'IconLayoutKanban',
                isNullable: true,
                options: [pipelineOption],
              },
            },
          },
        });

        pipelineFieldId = data?.createOneField.id;

        if (!isDefined(pipelineFieldId)) {
          throw new Error('Could not create the pipeline field');
        }

        // The original deal boards keep showing only deals that are not in a named pipeline.
        const stageFieldId = fieldByName('stage')?.id;
        const defaultBoards = views.filter(
          (view) =>
            view.type === ViewType.KANBAN &&
            view.mainGroupByFieldMetadataId === stageFieldId,
        );

        for (const view of defaultBoards) {
          await apolloClient.mutate({
            mutation: PULSE_CREATE_VIEW_FILTER,
            variables: {
              input: {
                viewId: view.id,
                fieldMetadataId: pipelineFieldId,
                operand: ViewFilterOperand.IS_EMPTY,
                value: '',
              },
            },
          });
        }
      }

      const { data: stageFieldData } = await apolloClient.mutate<{
        createOneField: { id: string };
      }>({
        mutation: PULSE_CREATE_FIELD,
        variables: {
          input: {
            field: {
              objectMetadataId: opportunityMetadataItem.id,
              type: FieldMetadataType.SELECT,
              name: makeUnique(
                `${toCamelCaseFieldName(name)}Stage`,
                takenFieldNames,
              ),
              label: `${name} stage`,
              icon: 'IconProgress',
              isNullable: true,
              options: buildStageOptions(stages),
            },
          },
        },
      });

      const stageFieldId = stageFieldData?.createOneField.id;

      if (!isDefined(stageFieldId)) {
        throw new Error('Could not create the stage field');
      }

      const { data: viewData } = await apolloClient.mutate<{
        createView: { id: string };
      }>({
        mutation: PULSE_CREATE_VIEW,
        variables: {
          input: {
            name,
            objectMetadataId: opportunityMetadataItem.id,
            type: ViewType.KANBAN,
            icon: 'IconLayoutKanban',
            position: views.length,
            visibility: ViewVisibility.WORKSPACE,
            mainGroupByFieldMetadataId: stageFieldId,
            kanbanAggregateOperation: AggregateOperations.SUM,
            kanbanAggregateOperationFieldMetadataId: fieldByName('amount')?.id,
          },
        },
      });

      const viewId = viewData?.createView.id;

      if (!isDefined(viewId)) {
        throw new Error('Could not create the pipeline board');
      }

      await apolloClient.mutate({
        mutation: PULSE_CREATE_VIEW_FIELDS,
        variables: {
          inputs: CARD_FIELD_NAMES.map(fieldByName)
            .filter(isDefined)
            .map((field, index) => ({
              viewId,
              fieldMetadataId: field.id,
              position: index,
              isVisible: true,
              size: index === 0 ? 240 : 160,
            })),
        },
      });

      await apolloClient.mutate({
        mutation: PULSE_CREATE_VIEW_FILTER,
        variables: {
          input: {
            viewId,
            fieldMetadataId: pipelineFieldId,
            operand: ViewFilterOperand.IS,
            value: JSON.stringify([pipelineOption.value]),
          },
        },
      });

      await apolloClient.mutate({
        mutation: PULSE_CREATE_NAVIGATION_MENU_ITEM,
        variables: {
          input: {
            type: NavigationMenuItemType.VIEW,
            viewId,
          },
        },
      });

      return viewId;
    } finally {
      setIsCreating(false);
    }
  };

  return { createPulsePipeline, isCreating };
};
