import {
  AggregateOperations,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
  defineView,
} from 'twenty-sdk/define';
import {
  OPPORTUNITY_BUYER_STAGE_FIELD_ID,
  OPPORTUNITY_BUYER_STAGE_OPTIONS,
} from '../fields/buyer-stage-on-opportunity.field';

export const BUYER_PIPELINE_VIEW_ID = '864022d4-f562-56d3-ad5e-e751fe1c8010';

const GROUP_IDS = [
  '5558d85e-18c3-5d3c-9faa-2527ee10168e',
  'c695778f-ec1c-52a4-9363-c5dda33ec81c',
  'b5f54ee2-efad-5ad3-b101-116b4ca362d1',
  '699c52fb-b057-573d-a9c2-0f45006fd128',
  '35a9c3fd-9f41-5093-a0ea-7bd3b22774a1',
  'fa7df5a8-55d9-50b7-9f17-74c11771ec55',
  '4fbce979-7e54-5a14-84bb-8541581614de',
];

export default defineView({
  universalIdentifier: BUYER_PIPELINE_VIEW_ID,
  name: 'Buyer Pipeline',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: ViewType.KANBAN,
  icon: 'IconUsers',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier: OPPORTUNITY_BUYER_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
      .universalIdentifier,
  fields: [
    {
      universalIdentifier: '4cb895c0-8cfc-5db3-8f51-a8127e228da7',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.name
          .universalIdentifier,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '48918429-c52f-51f1-8dfa-f4a5c8ac7343',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_BUYER_STAGE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '14de9de7-28a9-5336-b08e-a87af3fc9bc4',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
          .universalIdentifier,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '790788ab-1f84-53d2-bd25-e50491abcf1c',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.pointOfContact
          .universalIdentifier,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  groups: OPPORTUNITY_BUYER_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
