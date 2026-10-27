import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LOAN_OBJECT_ID } from '../objects/loan.object';

export const BORROWER_ON_LOAN_FIELD_ID = '8b93edb4-3779-5860-8766-f902357e385c';
export const LOANS_ON_PERSON_FIELD_ID = '634d1e51-b25e-57a2-8dfb-dbcf22cb9e9f';

export default defineField({
  universalIdentifier: BORROWER_ON_LOAN_FIELD_ID,
  objectUniversalIdentifier: LOAN_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'borrower',
  label: 'Borrower',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: LOANS_ON_PERSON_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'borrowerId',
  },
});
