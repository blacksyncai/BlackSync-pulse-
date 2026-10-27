import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_CURRENT_CARRIER_FIELD_ID =
  '65d94e6d-56e0-5356-b485-c0b62919d4a0';

export default defineField({
  universalIdentifier: PERSON_CURRENT_CARRIER_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'currentCarrier',
  label: 'Current carrier',
  icon: 'IconBuildingBank',
  isNullable: true,
});
