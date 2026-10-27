import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_FORECAST_CATEGORY_FIELD_ID =
  '2063de52-c39e-51e2-8d6a-43f7aca865f2';

export const OPPORTUNITY_FORECAST_CATEGORY_OPTIONS = [
  {
    id: '02688fc5-ba20-5231-88eb-fa70e0124668',
    value: 'PIPELINE',
    label: 'Pipeline',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'b9d4e54a-c68d-5ef3-bcf7-db7471746ac1',
    value: 'BEST_CASE',
    label: 'Best case',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: '127c37f9-156b-5be7-8ee8-a096e2cef00b',
    value: 'COMMIT',
    label: 'Commit',
    position: 2,
    color: 'purple' as const,
  },
  {
    id: 'b1a7883e-2999-5b12-b6fe-971f76953e26',
    value: 'CLOSED',
    label: 'Closed',
    position: 3,
    color: 'green' as const,
  },
  {
    id: '39ed0117-cdf9-57b1-9736-ef4cf67bdb0b',
    value: 'OMITTED',
    label: 'Omitted',
    position: 4,
    color: 'brown' as const,
  },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_FORECAST_CATEGORY_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'forecastCategory',
  label: 'Forecast',
  icon: 'IconChartLine',
  isNullable: true,
  options: OPPORTUNITY_FORECAST_CATEGORY_OPTIONS,
});
