import { AggregateOperations, ViewType, defineView } from 'twenty-sdk/define';
import { POLICYHOLDER_ON_POLICY_FIELD_ID } from '../fields/policyholder-on-policy.field';
import {
  POLICY_EXPIRATION_DATE_FIELD_ID,
  POLICY_NAME_FIELD_ID,
  POLICY_OBJECT_ID,
  POLICY_PREMIUM_FIELD_ID,
  POLICY_RENEWAL_STAGE_FIELD_ID,
  POLICY_RENEWAL_STAGE_OPTIONS,
} from '../objects/policy.object';

export const RENEWALS_PIPELINE_VIEW_ID = 'ff5cc1c9-3ac8-508a-84b1-52ae152433b1';

const GROUP_IDS = [
  'dde8b96a-29de-5acb-a0e0-854f829ff045',
  'ccecedfc-0eb8-5ed2-9410-d138f52de467',
  '1a56027b-aafb-53a6-a412-d1d2aa93de98',
  '4773f924-8fe4-5520-87a8-3ce9adbb9b98',
  'bb62b622-5488-5d9a-b603-5666a1a7f51f',
  'e25003ee-64de-5c4b-83f8-14b657a445d7',
];

export default defineView({
  universalIdentifier: RENEWALS_PIPELINE_VIEW_ID,
  name: 'Renewals',
  objectUniversalIdentifier: POLICY_OBJECT_ID,
  type: ViewType.KANBAN,
  icon: 'IconRefresh',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier: POLICY_RENEWAL_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    POLICY_PREMIUM_FIELD_ID,
  fields: [
    {
      universalIdentifier: 'f5f09744-a21e-5fad-9cf5-c02956175606',
      fieldMetadataUniversalIdentifier: POLICY_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '2350a7e5-a455-5e9c-a2ea-09ae09db86d4',
      fieldMetadataUniversalIdentifier: POLICY_EXPIRATION_DATE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '3b011edc-05cf-52f0-ae75-d5528e3f2c28',
      fieldMetadataUniversalIdentifier: POLICY_PREMIUM_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '76921a97-bb7e-5459-b0bb-49b8a04e3c2e',
      fieldMetadataUniversalIdentifier: POLICYHOLDER_ON_POLICY_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  groups: POLICY_RENEWAL_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
