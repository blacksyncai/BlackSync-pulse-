import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const COMPANY_SEGMENT_FIELD_ID = '7f304463-fb59-5630-8fc6-c580afb4bbbe';

export const COMPANY_SEGMENT_OPTIONS = [
  {
    id: '603ba856-797c-5d22-841e-e476bff7530a',
    value: 'SMB',
    label: 'SMB',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'fbe49584-ff08-56ac-9170-4d7ecf9e70c2',
    value: 'MID_MARKET',
    label: 'Mid-market',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '3f47d107-a69f-5d08-9dc5-0a35fce2de87',
    value: 'ENTERPRISE',
    label: 'Enterprise',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: '10d608e5-6a3b-5fa2-87bf-106399ce34b3',
    value: 'STRATEGIC',
    label: 'Strategic',
    position: 3,
    color: 'turquoise' as const,
  },
];

export default defineField({
  universalIdentifier: COMPANY_SEGMENT_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.SELECT,
  name: 'segment',
  label: 'Segment',
  icon: 'IconChartPie',
  isNullable: true,
  options: COMPANY_SEGMENT_OPTIONS,
});
