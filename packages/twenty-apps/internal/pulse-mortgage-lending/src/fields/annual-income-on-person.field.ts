import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_ANNUAL_INCOME_FIELD_ID =
  'ab13b671-1691-50ba-9a05-4a754356fce6';

export default defineField({
  universalIdentifier: PERSON_ANNUAL_INCOME_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.CURRENCY,
  name: 'annualIncome',
  label: 'Annual income',
  icon: 'IconCurrencyDollar',
  isNullable: true,
});
