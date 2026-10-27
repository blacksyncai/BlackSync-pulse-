import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_DESIRED_AREA_FIELD_ID =
  'a3d3461c-29fb-5b81-9111-36e7df1b2c0d';

export default defineField({
  universalIdentifier: PERSON_DESIRED_AREA_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'desiredArea',
  label: 'Desired area',
  icon: 'IconMapPin',
  isNullable: true,
});
