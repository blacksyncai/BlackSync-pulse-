import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_DEAL_TYPE_FIELD_ID =
  '6130b7b6-4d52-55eb-94b9-f37806079e1c';

export const OPPORTUNITY_DEAL_TYPE_OPTIONS = [
  {
    id: '9e612799-7690-563a-a127-5607aace0b71',
    value: 'NEW_BUSINESS',
    label: 'New business',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: '68be6309-deff-5c10-9d9f-c3af460d82ac',
    value: 'EXPANSION',
    label: 'Expansion',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '53829309-eb3a-5da1-b818-fa886c3d48f5',
    value: 'RENEWAL',
    label: 'Renewal',
    position: 2,
    color: 'sky' as const,
  },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_DEAL_TYPE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'dealType',
  label: 'Deal type',
  icon: 'IconTag',
  isNullable: true,
  options: OPPORTUNITY_DEAL_TYPE_OPTIONS,
});
