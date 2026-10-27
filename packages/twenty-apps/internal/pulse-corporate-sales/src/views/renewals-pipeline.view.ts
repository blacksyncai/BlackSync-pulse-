import {
  AggregateOperations,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
  defineView,
} from 'twenty-sdk/define';
import {
  OPPORTUNITY_RENEWAL_STAGE_FIELD_ID,
  OPPORTUNITY_RENEWAL_STAGE_OPTIONS,
} from '../fields/renewal-stage-on-opportunity.field';

export const RENEWALS_PIPELINE_VIEW_ID = '7631442c-e32e-561f-bf08-051c5dc04887';

const GROUP_IDS = [
  '2485d824-31ac-56a0-a29f-5928a2a5d65d',
  '0f9c1541-f19c-5e2e-a57d-4f9454d20375',
  'd990c8e5-7c74-5693-9e04-8b467d9c9fbc',
  '5b8e386e-8a11-5b27-a714-b56dc298f646',
  'ccb88d10-2e18-545b-b2f7-4dd30c27a5b2',
];

export default defineView({
  universalIdentifier: RENEWALS_PIPELINE_VIEW_ID,
  name: 'Renewals',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: ViewType.KANBAN,
  icon: 'IconRefresh',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier:
    OPPORTUNITY_RENEWAL_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
      .universalIdentifier,
  fields: [
    {
      universalIdentifier: '0c13692e-928b-51c2-a716-6952d887ce29',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.name
          .universalIdentifier,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '2717b958-3b2a-5ee6-a612-a34eae0f7a8b',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
          .universalIdentifier,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd56203d9-b33e-54ab-9578-54c64649389e',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.company
          .universalIdentifier,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'cf64b7a8-5d5e-5be2-bfba-e79dbe558e7d',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.closeDate
          .universalIdentifier,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  groups: OPPORTUNITY_RENEWAL_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
