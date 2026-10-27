import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_ANNUAL_REVENUE_FIELD_ID =
  '4f4e39f4-81fa-518f-9ec3-c0c5479ff4e5';

export default defineField({
  universalIdentifier: COMPANY_ANNUAL_REVENUE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.CURRENCY,
  name: 'annualRevenue',
  label: 'Annual revenue',
  icon: 'IconCurrencyDollar',
  isNullable: true,
});
