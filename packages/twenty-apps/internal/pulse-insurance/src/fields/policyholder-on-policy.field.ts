import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { POLICY_OBJECT_ID } from '../objects/policy.object';

export const POLICYHOLDER_ON_POLICY_FIELD_ID =
  '58217deb-373d-5b28-9f7c-19e3b8efd827';
export const POLICIES_ON_PERSON_FIELD_ID =
  '7f07bed3-fc4b-5faf-9176-d1bf2f28ed9b';

export default defineField({
  universalIdentifier: POLICYHOLDER_ON_POLICY_FIELD_ID,
  objectUniversalIdentifier: POLICY_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'policyholder',
  label: 'Policyholder',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: POLICIES_ON_PERSON_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'policyholderId',
  },
});
