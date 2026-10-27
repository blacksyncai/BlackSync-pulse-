import { AggregateOperations, ViewType, defineView } from 'twenty-sdk/define';
import { SELLER_ON_LISTING_FIELD_ID } from '../fields/seller-on-listing.field';
import {
  LISTING_LISTING_STAGE_FIELD_ID,
  LISTING_LISTING_STAGE_OPTIONS,
  LISTING_LIST_PRICE_FIELD_ID,
  LISTING_NAME_FIELD_ID,
  LISTING_OBJECT_ID,
  LISTING_PROPERTY_TYPE_FIELD_ID,
} from '../objects/listing.object';

export const LISTING_PIPELINE_VIEW_ID = '09aca5ab-56ae-577f-9cf5-424475bd6be5';

const GROUP_IDS = [
  '911d8752-2a92-54dd-a8d4-53d9cc7dc8f8',
  '7363b413-9652-57d9-bdc5-a585b1cf7645',
  'f7be3db3-67a6-54be-b530-7a0620c367dd',
  'dee06fb9-3fc4-5b9c-8a7a-412ac7fa8bdb',
  'c4dec468-14c5-59ed-9a34-493d0510bfd6',
  '26da0b2b-ac5b-569f-8332-6effba0df599',
  'ed8cfe19-9cfa-57aa-aaf0-f471176db2e0',
];

export default defineView({
  universalIdentifier: LISTING_PIPELINE_VIEW_ID,
  name: 'Listing Pipeline',
  objectUniversalIdentifier: LISTING_OBJECT_ID,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier: LISTING_LISTING_STAGE_FIELD_ID,
  kanbanAggregateOperation: AggregateOperations.SUM,
  kanbanAggregateOperationFieldMetadataUniversalIdentifier:
    LISTING_LIST_PRICE_FIELD_ID,
  fields: [
    {
      universalIdentifier: 'c7b3ace9-ccbe-50f5-8087-595fdd573957',
      fieldMetadataUniversalIdentifier: LISTING_NAME_FIELD_ID,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '66153465-ec64-5653-8318-06e7ee68aacc',
      fieldMetadataUniversalIdentifier: LISTING_LIST_PRICE_FIELD_ID,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '0a628581-1e02-5034-bfa2-34868586882e',
      fieldMetadataUniversalIdentifier: LISTING_PROPERTY_TYPE_FIELD_ID,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd5691dfa-8b8b-50bb-8c70-2ca04d2c082f',
      fieldMetadataUniversalIdentifier: SELLER_ON_LISTING_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
  ],
  groups: LISTING_LISTING_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
