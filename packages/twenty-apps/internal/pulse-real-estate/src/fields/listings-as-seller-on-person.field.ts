import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';
import { LISTING_OBJECT_ID } from '../objects/listing.object';
import {
  SELLER_ON_LISTING_FIELD_ID,
  LISTINGS_AS_SELLER_ON_PERSON_FIELD_ID,
} from './seller-on-listing.field';

export default defineField({
  universalIdentifier: LISTINGS_AS_SELLER_ON_PERSON_FIELD_ID,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'listingsAsSeller',
  label: 'Listings (seller)',
  icon: 'IconHome',
  relationTargetObjectMetadataUniversalIdentifier: LISTING_OBJECT_ID,
  relationTargetFieldMetadataUniversalIdentifier: SELLER_ON_LISTING_FIELD_ID,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
