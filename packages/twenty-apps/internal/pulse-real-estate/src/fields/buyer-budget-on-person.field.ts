import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_BUYER_BUDGET_FIELD_ID =
  'ee785d77-1307-58d1-9dc0-f4a053f3e5e9';

export default defineField({
  universalIdentifier: PERSON_BUYER_BUDGET_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.CURRENCY,
  name: 'buyerBudget',
  label: 'Buyer budget',
  icon: 'IconCurrencyDollar',
  isNullable: true,
});
