import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { POLICY_OBJECT_ID } from '../objects/policy.object';

export const INSURED_COMPANY_ON_POLICY_FIELD_ID =
  'e441af01-3fce-5481-b09f-0400c3d01520';
export const INSURANCE_POLICIES_ON_COMPANY_FIELD_ID =
  '43b335c4-a1f1-5711-84b6-a1bc7002003f';

export default defineField({
  universalIdentifier: INSURED_COMPANY_ON_POLICY_FIELD_ID,
  objectUniversalIdentifier: POLICY_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'insuredCompany',
  label: 'Insured company',
  icon: 'IconBuildingSkyscraper',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.company.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INSURANCE_POLICIES_ON_COMPANY_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'insuredCompanyId',
  },
});
