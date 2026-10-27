import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_ENTERPRISE_STAGE_FIELD_ID =
  '4a88cad8-63f1-593d-9424-a8ac85b41759';

export const OPPORTUNITY_ENTERPRISE_STAGE_OPTIONS = [
  {
    id: 'afbf186b-5c99-5af6-ade2-9b5d3e545192',
    value: 'PROSPECTING',
    label: 'Prospecting',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'e314305f-3d27-50c7-874e-2d2bb63e6956',
    value: 'DISCOVERY',
    label: 'Discovery',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: 'b04b0503-55ca-5b75-8656-ed4eab3b0b0b',
    value: 'DEMO',
    label: 'Demo',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: '17a52c0f-6907-502f-baa8-1969eaf151a0',
    value: 'PROPOSAL',
    label: 'Proposal',
    position: 3,
    color: 'purple' as const,
  },
  {
    id: 'a0d2ebf8-538e-56e0-8c08-e8279f1d86a0',
    value: 'NEGOTIATION',
    label: 'Negotiation',
    position: 4,
    color: 'orange' as const,
  },
  {
    id: '7f63f633-21e0-571b-ae86-68c9b211b533',
    value: 'CLOSED_WON',
    label: 'Closed won',
    position: 5,
    color: 'green' as const,
  },
  {
    id: '9b7938ac-06ae-5b5b-8068-455499537cdb',
    value: 'CLOSED_LOST',
    label: 'Closed lost',
    position: 6,
    color: 'red' as const,
  },
];

export default defineField({
  universalIdentifier: OPPORTUNITY_ENTERPRISE_STAGE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'enterpriseStage',
  label: 'Enterprise stage',
  icon: 'IconProgress',
  isNullable: true,
  options: OPPORTUNITY_ENTERPRISE_STAGE_OPTIONS,
});
