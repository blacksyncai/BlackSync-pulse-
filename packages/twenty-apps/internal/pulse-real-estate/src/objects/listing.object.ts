import { defineObject, FieldType } from 'twenty-sdk/define';

export const LISTING_OBJECT_ID = '3c12c096-4b7d-5714-8766-1f4d5dcd0ae3';
export const LISTING_NAME_FIELD_ID = 'afab40c8-df3a-54bf-a6b6-5e856a8670d9';
export const LISTING_LISTING_STAGE_FIELD_ID =
  '5e1b0c43-6584-5050-9c12-0ea188c13999';
export const LISTING_LIST_PRICE_FIELD_ID =
  '066f9fb2-4652-564a-b91d-37b558fab0cd';
export const LISTING_PROPERTY_TYPE_FIELD_ID =
  '22d5705c-3a21-5b51-bf01-e191b4478f82';
export const LISTING_PROPERTY_ADDRESS_FIELD_ID =
  'dc2cb336-aa50-5729-bdde-3179171bcf13';
export const LISTING_BEDROOMS_FIELD_ID = '4bc6bdef-4713-548f-973b-3dd058d4102e';
export const LISTING_BATHROOMS_FIELD_ID =
  '9969ee58-a3d6-5642-9a4b-fa93ad60f4d5';
export const LISTING_SQUARE_FEET_FIELD_ID =
  'eeb532a6-a8ff-5276-bb43-09f067f5b1d8';
export const LISTING_MLS_NUMBER_FIELD_ID =
  '434023f7-04f2-58b1-9df1-28b9346e692d';
export const LISTING_LIST_DATE_FIELD_ID =
  '525f2900-6e2f-55ee-a4d6-b253a765b55c';

export const LISTING_LISTING_STAGE_OPTIONS = [
  {
    id: '125afcbb-1b9a-5053-b3bb-7300ecc0c757',
    value: 'COMING_SOON',
    label: 'Coming soon',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'a3ad35f2-3460-5ca4-b8fd-c1670c80c2ca',
    value: 'ACTIVE',
    label: 'Active',
    position: 1,
    color: 'green' as const,
  },
  {
    id: '891e7dec-d4f1-5ace-b1ae-145b58b9fe44',
    value: 'UNDER_CONTRACT',
    label: 'Under contract',
    position: 2,
    color: 'orange' as const,
  },
  {
    id: '2895fa1f-0d16-5576-98b5-a6e21b96e17f',
    value: 'PENDING',
    label: 'Pending',
    position: 3,
    color: 'yellow' as const,
  },
  {
    id: 'a89e8455-81a3-57e0-96d5-57980d1d0cce',
    value: 'SOLD',
    label: 'Sold',
    position: 4,
    color: 'purple' as const,
  },
  {
    id: '52d8ccee-84c5-5c01-8563-1ab151b33222',
    value: 'WITHDRAWN',
    label: 'Withdrawn',
    position: 5,
    color: 'red' as const,
  },
  {
    id: 'c0ae9d2b-6dbb-5cb8-be92-f670e17b1c82',
    value: 'EXPIRED',
    label: 'Expired',
    position: 6,
    color: 'brown' as const,
  },
];

export const LISTING_PROPERTY_TYPE_OPTIONS = [
  {
    id: 'd9a55347-5d36-59a7-9460-0354b8a894dd',
    value: 'SINGLE_FAMILY',
    label: 'Single family',
    position: 0,
    color: 'gray' as const,
  },
  {
    id: 'a134aa24-2b91-59e1-b70b-d8df91ee08ba',
    value: 'CONDO',
    label: 'Condo',
    position: 1,
    color: 'blue' as const,
  },
  {
    id: '896884ef-aec9-54d7-8f03-3b77742b78fb',
    value: 'TOWNHOUSE',
    label: 'Townhouse',
    position: 2,
    color: 'sky' as const,
  },
  {
    id: 'ad3749e0-aa87-5ae2-b8be-c5dfb29919e7',
    value: 'MULTI_FAMILY',
    label: 'Multi-family',
    position: 3,
    color: 'turquoise' as const,
  },
  {
    id: '790967e6-0d31-5512-848b-afa5853673c0',
    value: 'LAND',
    label: 'Land',
    position: 4,
    color: 'purple' as const,
  },
  {
    id: '37bc5c3f-5991-568f-a10f-26641177abeb',
    value: 'COMMERCIAL',
    label: 'Commercial',
    position: 5,
    color: 'orange' as const,
  },
];

export default defineObject({
  universalIdentifier: LISTING_OBJECT_ID,
  nameSingular: 'listing',
  namePlural: 'listings',
  labelSingular: 'Listing',
  labelPlural: 'Listings',
  description: 'A property listing',
  icon: 'IconHome',
  labelIdentifierFieldMetadataUniversalIdentifier: LISTING_NAME_FIELD_ID,
  fields: [
    {
      universalIdentifier: LISTING_NAME_FIELD_ID,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Address',
      icon: 'IconMapPin',
      description: 'Street address or listing name',
    },
    {
      universalIdentifier: LISTING_LISTING_STAGE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'listingStage',
      label: 'Listing stage',
      icon: 'IconProgress',
      isNullable: true,
      options: LISTING_LISTING_STAGE_OPTIONS,
      defaultValue: "'COMING_SOON'",
    },
    {
      universalIdentifier: LISTING_LIST_PRICE_FIELD_ID,
      type: FieldType.CURRENCY,
      name: 'listPrice',
      label: 'List price',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: LISTING_PROPERTY_TYPE_FIELD_ID,
      type: FieldType.SELECT,
      name: 'propertyType',
      label: 'Property type',
      icon: 'IconBuildingCommunity',
      isNullable: true,
      options: LISTING_PROPERTY_TYPE_OPTIONS,
    },
    {
      universalIdentifier: LISTING_PROPERTY_ADDRESS_FIELD_ID,
      type: FieldType.ADDRESS,
      name: 'propertyAddress',
      label: 'Full address',
      icon: 'IconMap',
      isNullable: true,
    },
    {
      universalIdentifier: LISTING_BEDROOMS_FIELD_ID,
      type: FieldType.NUMBER,
      name: 'bedrooms',
      label: 'Bedrooms',
      icon: 'IconBed',
      isNullable: true,
    },
    {
      universalIdentifier: LISTING_BATHROOMS_FIELD_ID,
      type: FieldType.NUMBER,
      name: 'bathrooms',
      label: 'Bathrooms',
      icon: 'IconBath',
      isNullable: true,
    },
    {
      universalIdentifier: LISTING_SQUARE_FEET_FIELD_ID,
      type: FieldType.NUMBER,
      name: 'squareFeet',
      label: 'Square feet',
      icon: 'IconRuler2',
      isNullable: true,
    },
    {
      universalIdentifier: LISTING_MLS_NUMBER_FIELD_ID,
      type: FieldType.TEXT,
      name: 'mlsNumber',
      label: 'MLS #',
      icon: 'IconHash',
      isNullable: true,
    },
    {
      universalIdentifier: LISTING_LIST_DATE_FIELD_ID,
      type: FieldType.DATE,
      name: 'listDate',
      label: 'List date',
      icon: 'IconCalendar',
      isNullable: true,
    },
  ],
});
