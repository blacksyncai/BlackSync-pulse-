import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LOAN_OBJECT_ID } from '../objects/loan.object';
import {
  BUSINESS_BORROWER_ON_LOAN_FIELD_ID,
  BUSINESS_LOANS_ON_COMPANY_FIELD_ID,
} from './business-borrower-on-loan.field';

export default defineField({
  universalIdentifier: BUSINESS_LOANS_ON_COMPANY_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'businessLoans',
  label: 'Business loans',
  icon: 'IconCash',
  relationTargetObjectMetadataUniversalIdentifier: LOAN_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    BUSINESS_BORROWER_ON_LOAN_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
