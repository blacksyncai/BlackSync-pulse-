import {
  AggregateOperations,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
  defineView,
} from 'twenty-sdk/define';
import {
  OPPORTUNITY_ENTERPRISE_STAGE_FIELD_ID,
  OPPORTUNITY_ENTERPRISE_STAGE_OPTIONS,
} from '../fields/enterprise-stage-on-opportunity.field';
import { OPPORTUNITY_FORECAST_CATEGORY_FIELD_ID } from '../fields/forecast-category-on-opportunity.field';
import { OPPORTUNITY_NEXT_STEP_FIELD_ID } from '../fields/next-step-on-opportunity.field';

export const ENTERPRISE_PIPELINE_VIEW_ID =
  'c70dca0c-6b38-5a3e-b4b3-ee54824554b3';

const GROUP_IDS = [
  'eeec8261-fd21-5e32-b25c-50c0900215ab',
  '48bb00a7-6f4c-5590-8e10-7b42d6d79298',
  '486522f5-20b5-5d96-938c-1b59e1d85134',
  '20f24265-c5c0-548e-b386-b9066b8c72a2',
  '5a2a38b4-cc04-5378-a817-3718c5b55755',
  'e51fb90d-f7a0-5bc3-b6ec-648e742fe9a6',
  '58b8865f-beb2-5f6c-be9a-12bd5999652f',
];

export default defineView({
  universalIdentifier: ENTERPRISE_PIPELINE_VIEW_ID,
  name: 'Enterprise Pipeline',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    OPPORTUNITY_ENTERPRISE_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
      .universalIdentifier,
  fields: [
    {
      universalIdentifier: '5a6b70f9-b325-538d-81cd-92bed76da2e5',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.name
          .universalIdentifier,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '5a03d6ce-f875-5732-8d70-5d757df32341',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
          .universalIdentifier,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '480c3614-5835-57c9-a9b6-aa03b304fe7a',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.company
          .universalIdentifier,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '1a9122fb-2870-5ee6-81d4-8e8aa37fcbb5',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_FORECAST_CATEGORY_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '83ef7834-7676-5f04-9c8b-08a56bbd7069',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_NEXT_STEP_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
  groups: OPPORTUNITY_ENTERPRISE_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
