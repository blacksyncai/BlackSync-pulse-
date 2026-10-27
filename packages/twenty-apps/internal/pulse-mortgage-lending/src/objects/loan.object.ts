import { defineObject, FieldType } from 'twenty-sdk/define';

export const LOAN_OBJECT_ID = '33155676-2a6b-5593-8301-1a06fd312aae';
export const LOAN_NAME_FIELD_ID = 'bd324a6f-d7f6-5bb4-92ad-6f48aa079f0e';
export const LOAN_LOAN_STAGE_FIELD_ID = '62625b60-e2b5-5011-ac0f-f20cec245a1d';
export const LOAN_LOAN_AMOUNT_FIELD_ID = '803a1322-e10e-5a49-b5e2-887548e73ede';
export const LOAN_LOAN_TYPE_FIELD_ID = '28d9484c-132a-5661-b31b-68a23aa03108';
export const LOAN_LOAN_PURPOSE_FIELD_ID =
  '53949600-9e83-5cc4-9856-dcc0d1392852';
export const LOAN_INTEREST_RATE_FIELD_ID =
  '6407810e-a8e3-59d3-8d14-c24db171b090';
export const LOAN_TERM_MONTHS_FIELD_ID = '6220b804-0cf1-5323-ab46-fe07f5424e37';
export const LOAN_PROPERTY_ADDRESS_FIELD_ID =
  '0b57c3ea-8b70-5a57-82c3-5bba4fc1a402';
export const LOAN_ESTIMATED_CLOSE_DATE_FIELD_ID =
  '95fdf01e-1439-5c0d-88b9-5a47eee5bc34';

export const LOAN_LOAN_STAGE_OPTIONS = [
  {
    id: '5b54cb96-2d29-59f0-b131-8744a4ff01bd',
    value: 'LEAD',
    label: 'Lead',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: '1f2aa9cd-e2a1-56c5-9350-b35fd7a314fd',
    value: 'PRE_QUALIFIED',
    label: 'Pre-qualified',
    position: 1,
    color: 'sky' as const,
  },
  {
    id: '414f810f-c6e7-5ea1-87ba-2b982834b04d',
    value: 'APPLICATION',
    label: 'Application',
    position: 2,
    color: 'blue' as const,
  },
  {
    id: 'e20482bb-e250-5e98-b5ed-12b7306bb7f3',
    value: 'PROCESSING',
    label: 'Processing',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: '404e56cb-1670-5df2-a6a4-026f0a7da31a',
    value: 'UNDERWRITING',
    label: 'Underwriting',
    position: 4,
    color: 'yellow' as const,
  },
  {
    id: '153ed30b-9100-5a92-be1a-2b5da007966f',
    value: 'CONDITIONAL_APPROVAL',
    label: 'Conditional approval',
    position: 5,
    color: 'orange' as const,
  },
  {
    id: '3957ecc1-4240-57d7-aa4d-de5e1184c95c',
    value: 'CLEAR_TO_CLOSE',
    label: 'Clear to close',
    position: 6,
    color: 'purple' as const,
  },
  {
    id: 'c724b4de-722b-5944-990d-23a86b8f2820',
    value: 'FUNDED',
    label: 'Funded',
    position: 7,
    color: 'green' as const,
  },
  {
    id: '5cce030d-430c-593c-b286-ce0f2c7f0391',
    value: 'LOST',
    label: 'Lost',
    position: 8,
    color: 'red' as const,
  },
];

export const LOAN_LOAN_TYPE_OPTIONS = [
  {
    id: '1fb6989e-a551-531e-bd7c-e0154e1c9353',
    value: 'CONVENTIONAL',
    label: 'Conventional',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'c827c87e-f3b6-53db-b1c2-4c304e3873d4',
    value: 'FHA',
    label: 'FHA',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: 'e03c9a63-73b5-56bd-915c-0ad3ee2b46e0',
    value: 'VA',
    label: 'VA',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: 'ec6ddec1-0ca6-57dc-a656-e92bda21deb9',
    value: 'USDA',
    label: 'USDA',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: '72fd7bc2-a9e1-5e53-80bc-35d50bf2f911',
    value: 'JUMBO',
    label: 'Jumbo',
    position: 4,
    color: 'purple' as const,
  },
  {
    id: 'a80b037b-7078-5755-84e7-2b42e29f55cb',
    value: 'NON_QM',
    label: 'Non-QM',
    position: 5,
    color: 'orange' as const,
  },
  {
    id: '6c52fd5f-9221-5666-8d02-9ec20f0ec17c',
    value: 'HELOC',
    label: 'HELOC',
    position: 6,
    color: 'yellow' as const,
  },
  {
    id: '31a98854-d11f-5c08-b35e-38d5fcc4684b',
    value: 'COMMERCIAL',
    label: 'Commercial',
    position: 7,
    color: 'green' as const,
  },
  {
    id: 'c2262f8f-8129-50e1-9b9f-5375931b1bc8',
    value: 'BUSINESS_LOAN',
    label: 'Business loan',
    position: 8,
    color: 'red' as const,
  },
  {
    id: '408bc83f-2636-5cc6-914e-3b5acd6ffdd1',
    value: 'SBA',
    label: 'SBA',
    position: 9,
    color: 'pink' as const,
  },
];

export const LOAN_LOAN_PURPOSE_OPTIONS = [
  {
    id: '04c01be2-68fb-5023-be0d-7fbb4e0cfc6d',
    value: 'PURCHASE',
    label: 'Purchase',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: '345438a8-6eec-5e87-ab27-1cb71bc989ff',
    value: 'REFINANCE',
    label: 'Refinance',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '386aa6af-3667-55e7-9fec-057467b56aa8',
    value: 'CASH_OUT_REFINANCE',
    label: 'Cash-out refinance',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: '47e095f7-ff74-5133-bdbc-ec1584a6ce96',
    value: 'CONSTRUCTION',
    label: 'Construction',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: 'e010e716-0453-50de-8748-fc87911c5c0a',
    value: 'BUSINESS',
    label: 'Business',
    position: 4,
    color: 'purple' as const,
  },
];

export default defineObject({
  universalIdentifier: LOAN_OBJECT_ID,
  nameSingular: 'loan',
  namePlural: 'loans',
  labelSingular: 'Loan',
  labelPlural: 'Loans',
  description: 'A loan application',
  icon: 'IconCash',
  labelIdentifierFieldMetadataUniversalIdentifier: LOAN_NAME_FIELD_ID,
  fields: [
    {
      universalIdentifier: LOAN_NAME_FIELD_ID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Loan',
      icon: 'IconFileDollar',
      description: 'Borrower and property, e.g. Smith - 12 Oak St',
    },
    {
      universalIdentifier: LOAN_LOAN_STAGE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'loanStage',
      label: 'Loan stage',
      icon: 'IconProgress',
      isNullable: true,
      options: LOAN_LOAN_STAGE_OPTIONS,
      defaultValue: "'LEAD'",
    },
    {
      universalIdentifier: LOAN_LOAN_AMOUNT_FIELD_ID,
      type: FieldType.CURRENCY,
      name: 'loanAmount',
      label: 'Loan amount',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: LOAN_LOAN_TYPE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'loanType',
      label: 'Loan type',
      icon: 'IconCategory',
      isNullable: true,
      options: LOAN_LOAN_TYPE_OPTIONS,
    },
    {
      universalIdentifier: LOAN_LOAN_PURPOSE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'loanPurpose',
      label: 'Purpose',
      icon: 'IconTarget',
      isNullable: true,
      options: LOAN_LOAN_PURPOSE_OPTIONS,
    },
    {
      universalIdentifier: LOAN_INTEREST_RATE_FIELD_ID,
      type: FieldType.NUMBER,
      name: 'interestRate',
      label: 'Rate (%)',
      icon: 'IconPercentage',
      isNullable: true,
    },
    {
      universalIdentifier: LOAN_TERM_MONTHS_FIELD_ID,
      type: FieldType.NUMBER,
      name: 'termMonths',
      label: 'Term (months)',
      icon: 'IconCalendarStats',
      isNullable: true,
    },
    {
      universalIdentifier: LOAN_PROPERTY_ADDRESS_FIELD_ID,
      type: FieldType.ADDRESS,
      name: 'propertyAddress',
      label: 'Property address',
      icon: 'IconHome',
      isNullable: true,
    },
    {
      universalIdentifier: LOAN_ESTIMATED_CLOSE_DATE_FIELD_ID,
      type: FieldType.DATE,
      name: 'estimatedCloseDate',
      label: 'Estimated close',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
  ],
});
