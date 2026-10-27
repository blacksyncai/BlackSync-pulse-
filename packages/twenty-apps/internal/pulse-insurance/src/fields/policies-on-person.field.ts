import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { POLICY_OBJECT_ID } from '../objects/policy.object';
import {
  POLICYHOLDER_ON_POLICY_FIELD_ID,
  POLICIES_ON_PERSON_FIELD_ID,
} from './policyholder-on-policy.field';

export default defineField({
  universalIdentifier: POLICIES_ON_PERSON_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'policies',
  label: 'Policies',
  icon: 'IconShieldCheck',
  relationTargetObjectMetadataUniversalIdentifier: POLICY_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    POLICYHOLDER_ON_POLICY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
