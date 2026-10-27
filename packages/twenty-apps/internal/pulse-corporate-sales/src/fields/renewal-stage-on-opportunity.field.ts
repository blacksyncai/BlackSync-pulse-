import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_RENEWAL_STAGE_FIELD_ID =
  'c3e6f0c2-211c-598e-810d-9041e7df5257';

export const OPPORTUNITY_RENEWAL_STAGE_OPTIONS = [
  {
    id: 'f27d1809-e8a8-50a6-9e05-9009fe0b6ec0',
    value: 'UPCOMING',
    label: 'Upcoming',
    position: 0,
    color: 'sky' as const,
  },
  {
    id: 'c15d340b-502b-56c2-8792-d3cba8d92c30',
    value: 'IN_REVIEW',
    label: 'In review',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '4aaf9f84-17d4-50e2-8335-7ca2ae5ac9ce',
    value: 'NEGOTIATING',
    label: 'Negotiating',
    position: 2,
    color: 'orange' as const,
  },
  {
    id: '1e1b8bdf-276f-5ae7-9fbb-988772b29a31',
    value: 'RENEWED',
    label: 'Renewed',
    position: 3,
    color: 'green' as const,
  },
  {
    id: '2f372d75-a04a-52ad-927d-65a6d876fd30',
    value: 'CHURNED',
    label: 'Churned',
    position: 4,
    color: 'red' as const,
  },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_RENEWAL_STAGE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'renewalStage',
  label: 'Renewal stage',
  icon: 'IconRefresh',
  isNullable: true,
  options: OPPORTUNITY_RENEWAL_STAGE_OPTIONS,
});
