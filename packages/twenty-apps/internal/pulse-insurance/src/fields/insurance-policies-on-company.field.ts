import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { POLICY_OBJECT_ID } from '../objects/policy.object';
import {
  INSURED_COMPANY_ON_POLICY_FIELD_ID,
  INSURANCE_POLICIES_ON_COMPANY_FIELD_ID,
} from './insured-company-on-policy.field';

export default defineField({
  universalIdentifier: INSURANCE_POLICIES_ON_COMPANY_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  type: FieldType.RELATION,
  name: 'insurancePolicies',
  label: 'Insurance policies',
  icon: 'IconShieldCheck',
  relationTargetObjectMetadataUniversalIdentifier: POLICY_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier:
    INSURED_COMPANY_ON_POLICY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
