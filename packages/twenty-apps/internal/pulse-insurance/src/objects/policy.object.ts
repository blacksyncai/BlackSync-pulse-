import { defineObject, FieldType } from 'twenty-sdk/define';

export const POLICY_OBJECT_ID = 'e3ef4e8d-8c7e-59c5-8bdb-c09a0b1326d8';
export const POLICY_NAME_FIELD_ID = 'd80cb644-8632-584a-be33-4d931785f0b4';
export const POLICY_SALES_STAGE_FIELD_ID =
  '49fdcbc2-432f-51e4-bb84-15c84596ac9c';
export const POLICY_RENEWAL_STAGE_FIELD_ID =
  '18fe15d3-2884-57c7-a5db-88434f07e7f4';
export const POLICY_LINE_OF_BUSINESS_FIELD_ID =
  '8cc1f97f-8c34-5ef8-b739-838c7db72872';
export const POLICY_CARRIER_FIELD_ID = '6d6fafba-d018-57d0-ae7e-b19ae7269f4c';
export const POLICY_PREMIUM_FIELD_ID = 'fd4714b7-314e-5f84-90b8-7248f0a332c5';
export const POLICY_COVERAGE_AMOUNT_FIELD_ID =
  'f9085f13-d933-5751-bb84-73828adfe9e2';
export const POLICY_EFFECTIVE_DATE_FIELD_ID =
  '964712cc-32ee-55b1-9563-f8113eb65134';
export const POLICY_EXPIRATION_DATE_FIELD_ID =
  '3d1f5168-a5b6-5646-af45-d13525de53e4';

export const POLICY_SALES_STAGE_OPTIONS = [
  {
    id: 'b7b431d7-7ea4-5617-8e18-8260fb432a08',
    value: 'NEW_LEAD',
    label: 'New lead',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'b08dde79-1a62-57e8-9d1f-c2bffaff4059',
    value: 'CONTACTED',
    label: 'Contacted',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: '9721f3e7-540f-5a9d-a320-9c08bf3b2ce7',
    value: 'QUOTING',
    label: 'Quoting',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: '153c7482-b3c4-54cb-ac30-75fe41bfc5e1',
    value: 'QUOTED',
    label: 'Quoted',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: 'c781e3e7-6b36-5a2e-8881-c3b3bea99273',
    value: 'APPLICATION',
    label: 'Application',
    position: 4,
    color: 'orange' as const,
  },
  {
    id: '583ff9b0-be70-5cc9-a10c-fc437040fd60',
    value: 'UNDERWRITING',
    label: 'Underwriting',
    position: 5,
    color: 'yellow' as const,
  },
  {
    id: '5b73f20e-6372-5f21-94a9-9c472a6b7f95',
    value: 'BOUND',
    label: 'Bound',
    position: 6,
    color: 'green' as const,
  },
  {
    id: '2194b8a4-72d7-5d37-88e9-a569e3eee53c',
    value: 'LOST',
    label: 'Lost',
    position: 7,
    color: 'red' as const,
  },
];

export const POLICY_RENEWAL_STAGE_OPTIONS = [
  {
    id: 'c63a413c-9c7e-536a-af3f-15b51bed9252',
    value: 'NOT_DUE',
    label: 'Not due',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'b5c4460d-3b5c-5ff2-bf74-ec6a7575e492',
    value: 'UPCOMING',
    label: 'Upcoming',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: '026f5b23-a209-571e-ba22-a1db3d191f99',
    value: 'CONTACTED',
    label: 'Contacted',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: '5915fcdd-de30-5cb2-b2c4-8b55f5687d94',
    value: 'RE_QUOTED',
    label: 'Re-quoted',
    position: 3,
    color: 'orange' as const,
  },
  {
    id: 'a65cc97e-fbfe-5996-a562-22c00dee4546',
    value: 'RENEWED',
    label: 'Renewed',
    position: 4,
    color: 'green' as const,
  },
  {
    id: '77d99d5a-43ab-541f-a3d5-4235f5672dc7',
    value: 'LAPSED',
    label: 'Lapsed',
    position: 5,
    color: 'red' as const,
  },
];

export const POLICY_LINE_OF_BUSINESS_OPTIONS = [
  {
    id: '66e86cf8-1b72-5b75-8dd2-1c6e4471f1e8',
    value: 'AUTO',
    label: 'Auto',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: '72ddecc7-98b9-5efe-bf2f-792f1348739a',
    value: 'HOME',
    label: 'Home',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '43b6004f-9760-51a7-a539-e4bf2713a356',
    value: 'LIFE',
    label: 'Life',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: '316a0776-36b7-5ecc-bb81-d51f75435738',
    value: 'HEALTH',
    label: 'Health',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: 'e37b0f7d-6d3d-5bbe-a3d2-947b20413007',
    value: 'MEDICARE',
    label: 'Medicare',
    position: 4,
    color: 'purple' as const,
  },
  {
    id: 'e3ebecdc-e7bc-57a1-8140-8d573499db18',
    value: 'COMMERCIAL',
    label: 'Commercial',
    position: 5,
    color: 'orange' as const,
  },
  {
    id: 'f3afb722-8663-57ca-86c7-c5a306eaaef3',
    value: 'UMBRELLA',
    label: 'Umbrella',
    position: 6,
    color: 'yellow' as const,
  },
  {
    id: '5b99127d-3e01-5b9a-ae2b-4c75c448ffda',
    value: 'OTHER',
    label: 'Other',
    position: 7,
    color: 'green' as const,
  },
];

export default defineObject({
  universalIdentifier: POLICY_OBJECT_ID,
  nameSingular: 'policy',
  namePlural: 'policies',
  labelSingular: 'Policy',
  labelPlural: 'Policies',
  description: 'An insurance policy or quote',
  icon: 'IconShieldCheck',
  labelIdentifierFieldMetadataUniversalIdentifier: POLICY_NAME_FIELD_ID,
  fields: [
    {
      universalIdentifier: POLICY_NAME_FIELD_ID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Policy',
      icon: 'IconFileCertificate',
      description: 'Policy number or quote name',
    },
    {
      universalIdentifier: POLICY_SALES_STAGE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'salesStage',
      label: 'Sales stage',
      icon: 'IconProgress',
      isNullable: true,
      options: POLICY_SALES_STAGE_OPTIONS,
      defaultValue: "'NEW_LEAD'",
    },
    {
      universalIdentifier: POLICY_RENEWAL_STAGE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'renewalStage',
      label: 'Renewal stage',
      icon: 'IconRefresh',
      isNullable: true,
      options: POLICY_RENEWAL_STAGE_OPTIONS,
    },
    {
      universalIdentifier: POLICY_LINE_OF_BUSINESS_FIELD_ID,
      type: FieldType.SELECT,
      name: 'lineOfBusiness',
      label: 'Line of business',
      icon: 'IconCategory',
      isNullable: true,
      options: POLICY_LINE_OF_BUSINESS_OPTIONS,
    },
    {
      universalIdentifier: POLICY_CARRIER_FIELD_ID,
      type: FieldType.TEXT,
      name: 'carrier',
      label: 'Carrier',
      icon: 'IconBuildingBank',
      isNullable: true,
    },
    {
      universalIdentifier: POLICY_PREMIUM_FIELD_ID,
      type: FieldType.CURRENCY,
      name: 'premium',
      label: 'Annual premium',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: POLICY_COVERAGE_AMOUNT_FIELD_ID,
      type: FieldType.CURRENCY,
      name: 'coverageAmount',
      label: 'Coverage amount',
      icon: 'IconShield',
      isNullable: true,
    },
    {
      universalIdentifier: POLICY_EFFECTIVE_DATE_FIELD_ID,
      type: FieldType.DATE,
      name: 'effectiveDate',
      label: 'Effective date',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: POLICY_EXPIRATION_DATE_FIELD_ID,
      type: FieldType.DATE,
      name: 'expirationDate',
      label: 'Expiration date',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
  ],
});
