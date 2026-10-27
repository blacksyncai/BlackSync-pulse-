import {
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
  defineView,
} from 'twenty-sdk/define';
import { OPPORTUNITY_DEAL_TYPE_FIELD_ID } from '../fields/deal-type-on-opportunity.field';
import { OPPORTUNITY_ENTERPRISE_STAGE_FIELD_ID } from '../fields/enterprise-stage-on-opportunity.field';
import { OPPORTUNITY_FORECAST_CATEGORY_FIELD_ID } from '../fields/forecast-category-on-opportunity.field';

export const FORECAST_VIEW_ID = '76628430-9262-5c5c-b259-e86d16a44d08';

export default defineView({
  universalIdentifier: FORECAST_VIEW_ID,
  name: 'Forecast',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconChartLine',
  position: 2,
  fields: [
    {
      universalIdentifier: '14850a8e-361a-5673-803f-87e45bca7f6e',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.name
          .universalIdentifier,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '097b0d42-6083-5a0d-b4bf-cc5572189fed',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.amount
          .universalIdentifier,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '54f9bc79-914f-5689-a6dc-857dbc10090b',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.closeDate
          .universalIdentifier,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '11171dcf-457f-5b51-bed9-93aa9289db7c',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_FORECAST_CATEGORY_FIELD_ID,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '7f587ec1-1837-5000-9572-b7594c836f28',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_DEAL_TYPE_FIELD_ID,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '28222b00-3501-5fe0-b7df-f4fa5c97b1d0',
      fieldMetadataUniversalIdentifier: OPPORTUNITY_ENTERPRISE_STAGE_FIELD_ID,
      position: 5,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'fe23b5e4-60cc-53c4-b495-ffead8afaac2',
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.owner
          .universalIdentifier,
      position: 6,
      isVisible: true,
      size: 160,
    },
  ],
});
