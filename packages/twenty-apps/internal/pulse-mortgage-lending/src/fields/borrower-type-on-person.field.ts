import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_BORROWER_TYPE_FIELD_ID =
  '255a8b53-bd35-5f61-9fed-71009ac37c7e';

export const PERSON_BORROWER_TYPE_OPTIONS = [
  {
    id: 'f3c9bc49-7179-5161-a544-338f8cdc0996',
    value: 'FIRST_TIME_BUYER',
    label: 'First-time buyer',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'c4a9a5d7-d75a-5009-b2e6-8ab62b3d960c',
    value: 'REPEAT_BUYER',
    label: 'Repeat buyer',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '9191253e-99a4-5a25-a040-80d6b557f114',
    value: 'REFINANCE',
    label: 'Refinance',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: '318942c3-0269-5d2a-b732-1f2a97913700',
    value: 'INVESTOR',
    label: 'Investor',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: 'eca2c055-e7ae-53ac-ad78-4da0eb2bd290',
    value: 'BUSINESS_OWNER',
    label: 'Business owner',
    position: 4,
    color: 'purple' as const,
  },
];

export default defineField({
  universalIdentifier: PERSON_BORROWER_TYPE_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'borrowerType',
  label: 'Borrower type',
  icon: 'IconUserCircle',
  isNullable: true,
  options: PERSON_BORROWER_TYPE_OPTIONS,
});
