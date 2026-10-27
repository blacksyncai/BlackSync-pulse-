import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LISTING_OBJECT_ID } from '../objects/listing.object';

export const SELLER_ON_LISTING_FIELD_ID =
  'e3e100ec-884f-55ac-9687-f13644025262';
export const LISTINGS_AS_SELLER_ON_PERSON_FIELD_ID =
  '677c2746-b82b-5739-8396-88a7de623571';

export default defineField({
  universalIdentifier: SELLER_ON_LISTING_FIELD_ID,
  objectUniversalIdentifier: LISTING_OBJECT_ID,
  type: FieldType.RELATION,
  name: 'seller',
  label: 'Seller',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    LISTINGS_AS_SELLER_ON_PERSON_FIELD_ID,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'sellerId',
  },
});
