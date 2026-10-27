import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_DATE_OF_BIRTH_FIELD_ID =
  '1b9a41fc-cdc6-5c71-a2b4-f3dc2a1040a8';

export default defineField({
  universalIdentifier: PERSON_DATE_OF_BIRTH_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE,
  name: 'dateOfBirth',
  label: 'Date of birth',
  icon: 'IconCake',
  isNullable: true,
});
