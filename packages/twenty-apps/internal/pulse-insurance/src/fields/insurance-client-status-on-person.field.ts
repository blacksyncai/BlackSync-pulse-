import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_INSURANCE_CLIENT_STATUS_FIELD_ID =
  '4b610244-6c36-591a-9fef-938388670dd1';

export const PERSON_INSURANCE_CLIENT_STATUS_OPTIONS = [
  {
    id: '344ff915-2775-5099-b174-b07d2407ea08',
    value: 'PROSPECT',
    label: 'Prospect',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'c8dd6a4c-a36c-5867-ab77-629138278cf0',
    value: 'CLIENT',
    label: 'Client',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: 'c91741a0-ef89-5dce-9df4-bf78e7f417ab',
    value: 'FORMER_CLIENT',
    label: 'Former client',
    position: 2,
    color: 'sky' as const,
  },
];

export default defineField({
  universalIdentifier: PERSON_INSURANCE_CLIENT_STATUS_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'insuranceClientStatus',
  label: 'Client status',
  icon: 'IconUserCircle',
  isNullable: true,
  options: PERSON_INSURANCE_CLIENT_STATUS_OPTIONS,
});
