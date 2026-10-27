import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_CREDIT_SCORE_FIELD_ID =
  '77cabfa2-44a6-5a72-b8a3-4254588555f1';

export default defineField({
  universalIdentifier: PERSON_CREDIT_SCORE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'creditScore',
  label: 'Credit score',
  icon: 'IconGauge',
  isNullable: true,
});
