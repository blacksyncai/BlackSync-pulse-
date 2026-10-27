import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LOAN_OBJECT_ID } from '../objects/loan.object';
import {
  BORROWER_ON_LOAN_FIELD_ID,
  LOANS_ON_PERSON_FIELD_ID,
} from './borrower-on-loan.field';

export default defineField({
  universalIdentifier: LOANS_ON_PERSON_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'loans',
  label: 'Loans',
  icon: 'IconCash',
  relationTargetObjectMetadataUniversalIdentifier: LOAN_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier: BORROWER_ON_LOAN_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
