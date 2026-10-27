import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_NEXT_STEP_FIELD_ID =
  '5a51b2a0-04e0-53d6-843b-1fa59e4e17b4';

export default defineField({
  universalIdentifier: OPPORTUNITY_NEXT_STEP_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'nextStep',
  label: 'Next step',
  icon: 'IconArrowRight',
  isNullable: true,
});
