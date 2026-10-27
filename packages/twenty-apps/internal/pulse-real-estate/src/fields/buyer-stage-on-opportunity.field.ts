import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_BUYER_STAGE_FIELD_ID =
  'eb3006d5-2600-5d65-b413-2dc6e98744fa';

export const OPPORTUNITY_BUYER_STAGE_OPTIONS = [
  {
    id: '74f2f0d0-1dcc-510c-a8eb-73bc9ef67309',
    value: 'NEW_LEAD',
    label: 'New lead',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'a7183bf3-e8ba-5465-be0d-299c0f3d219e',
    value: 'NURTURING',
    label: 'Nurturing',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: '5f46b234-96f7-5640-9f37-f1f2fd4690ea',
    value: 'SHOWING',
    label: 'Showing',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: 'be2b5042-a605-5169-abcb-17a46bc0200b',
    value: 'OFFER_MADE',
    label: 'Offer made',
    position: 3,
    color: 'orange' as const,
  },
  {
    id: '5dd304ff-0dae-5326-b7d9-5f699fe95612',
    value: 'UNDER_CONTRACT',
    label: 'Under contract',
    position: 4,
    color: 'purple' as const,
  },
  {
    id: '9e9cb37a-b731-5c16-882f-fd2eb207f647',
    value: 'CLOSED',
    label: 'Closed',
    position: 5,
    color: 'green' as const,
  },
  {
    id: 'e754898e-9f74-542f-b53b-ae50b86c4eea',
    value: 'LOST',
    label: 'Lost',
    position: 6,
    color: 'red' as const,
  },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_BUYER_STAGE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'buyerStage',
  label: 'Buyer stage',
  icon: 'IconRoute',
  isNullable: true,
  options: OPPORTUNITY_BUYER_STAGE_OPTIONS,
});
