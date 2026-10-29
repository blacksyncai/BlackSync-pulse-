import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';

export const PULSE_CUSTOMIZABLE_OBJECTS = [
  { nameSingular: CoreObjectNameSingular.Company, label: 'Leads' },
  { nameSingular: CoreObjectNameSingular.Person, label: 'Contacts' },
  { nameSingular: CoreObjectNameSingular.Opportunity, label: 'Deals' },
] as const;

export const PULSE_FIELD_TYPES = [
  { type: FieldMetadataType.TEXT, label: 'Text', icon: 'IconAbc' },
  { type: FieldMetadataType.NUMBER, label: 'Number', icon: 'IconNumber' },
  { type: FieldMetadataType.CURRENCY, label: 'Money', icon: 'IconCoins' },
  { type: FieldMetadataType.DATE, label: 'Date', icon: 'IconCalendarEvent' },
  { type: FieldMetadataType.SELECT, label: 'Dropdown', icon: 'IconTag' },
  {
    type: FieldMetadataType.MULTI_SELECT,
    label: 'Multi-select',
    icon: 'IconTags',
  },
  { type: FieldMetadataType.BOOLEAN, label: 'Checkbox', icon: 'IconCheckbox' },
  { type: FieldMetadataType.LINKS, label: 'Link', icon: 'IconLink' },
] as const;

// Fields Pulse manages itself (statuses, pipelines and their stages) are edited in their own sections.
export const PULSE_MANAGED_FIELD_NAMES = ['leadStatus', 'pipeline', 'priority'];
