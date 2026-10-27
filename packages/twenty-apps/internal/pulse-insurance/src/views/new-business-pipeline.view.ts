import { AggregateOperations, ViewType, defineView } from 'twenty-sdk/define';
import { POLICYHOLDER_ON_POLICY_FIELD_ID } from '../fields/policyholder-on-policy.field';
import {
  POLICY_LINE_OF_BUSINESS_FIELD_ID,
  POLICY_NAME_FIELD_ID,
  POLICY_OBJECT_ID,
  POLICY_PREMIUM_FIELD_ID,
  POLICY_SALES_STAGE_FIELD_ID,
  POLICY_SALES_STAGE_OPTIONS,
} from '../objects/policy.object';

export const NEW_BUSINESS_PIPELINE_VIEW_ID =
  '353db47e-3db2-5d1b-a298-1652e4b2a1fd';

const GROUP_IDS = [
  'ff3007a2-7213-5350-aed9-86a985e2c03f',
  '44b6fad6-a21c-5a4a-9d36-122d269d95a1',
  '4362795e-9110-519f-9726-e52d1a4db828',
  '3e7e9ded-59a3-59a4-a5de-fb203796108d',
  'a430ab2a-94f2-5c27-864d-c3a986f22084',
  '5ae08f84-b05d-5e3b-9954-f3f287fa5687',
  '3af9989d-0cf1-5d4a-aae9-8d840a5f851f',
  '08c8eed1-0d0d-567b-82c8-7c4efeab43b0',
];

export default defineView({
  universalIdentifier: NEW_BUSINESS_PIPELINE_VIEW_ID,
  name: 'New Business',
  objectUniversalIdentifier: POLICY_OBJECT_ID,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier: POLICY_SALES_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    POLICY_PREMIUM_FIELD_ID,
  fields: [
    {
      universalIdentifier: '0f71081f-478e-51b4-8b31-8494ecd5ba85',
      fieldMetadataUniversalIdentifier: POLICY_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '51c9189c-cca7-5f63-86b8-e9d24b8a3896',
      fieldMetadataUniversalIdentifier: POLICY_LINE_OF_BUSINESS_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd77f565d-e190-57e1-aaf2-3668ce36c0f3',
      fieldMetadataUniversalIdentifier: POLICY_PREMIUM_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '69e76636-1e12-5293-8aa6-026dde900677',
      fieldMetadataUniversalIdentifier: POLICYHOLDER_ON_POLICY_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  groups: POLICY_SALES_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
