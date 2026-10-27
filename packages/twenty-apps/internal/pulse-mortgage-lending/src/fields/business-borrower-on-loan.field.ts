import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LOAN_OBJECT_ID } from '../objects/loan.object';

export const BUSINESS_BORROWER_ON_LOAN_FIELD_ID =
  '830afd3c-6151-596d-b402-6247dfc51ea0';
export const BUSINESS_LOANS_ON_COMPANY_FIELD_ID =
  '2be16ce0-c363-59c8-94cb-17a8c6a70442';

export default defineField({
  universalIdentifier: BUSINESS_BORROWER_ON_LOAN_FIELD_ID,
  objectUniversalIdentifier: LOAN_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'businessBorrower',
  label: 'Business borrower',
  icon: 'IconBuildingSkyscraper',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    BUSINESS_LOANS_ON_COMPANY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'businessBorrowerId',
  },
});
