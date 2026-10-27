import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_REAL_ESTATE_ROLE_FIELD_ID =
  'fa7655a7-bf41-59c5-b0f9-b9b6f40ea00b';

export const PERSON_REAL_ESTATE_ROLE_OPTIONS = [
  {
    id: '3523e545-9173-555b-bc45-c68cf7fccfb0',
    value: 'BUYER',
    label: 'Buyer',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: '97ad9818-c6e8-5647-b7df-176c965efaf0',
    value: 'SELLER',
    label: 'Seller',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '55bdaa1c-42d6-56cc-93e9-54324ab64d27',
    value: 'BUYER_SELLER',
    label: 'Buyer & seller',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: '0132ca3c-7787-50e7-904d-6d6c46ac1d44',
    value: 'INVESTOR',
    label: 'Investor',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: '5557938c-52f1-5abd-b8b4-c6b15cfc7bd2',
    value: 'RENTER',
    label: 'Renter',
    position: 4,
    color: 'purple' as const,
  },
  {
    id: 'b6483ed8-71e9-546a-a05f-09c314108cb3',
    value: 'AGENT',
    label: 'Agent',
    position: 5,
    color: 'orange' as const,
  },
  {
    id: '88b0f230-8fdf-5a2e-91d6-0370ffb43535',
    value: 'LENDER',
    label: 'Lender',
    position: 6,
    color: 'yellow' as const,
  },
];

export default defineField({
  universalIdentifier: PERSON_REAL_ESTATE_ROLE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'realEstateRole',
  label: 'Real estate role',
  icon: 'IconUserCircle',
  isNullable: true,
  options: PERSON_REAL_ESTATE_ROLE_OPTIONS,
});
