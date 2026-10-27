import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_PRE_APPROVED_FIELD_ID =
  'af557f94-747f-582d-ae0a-b97559837581';

export default defineField({
  universalIdentifier: PERSON_PRE_APPROVED_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'preApproved',
  label: 'Pre-approved',
  icon: 'IconCircleCheck',
  isNullable: true,
});
