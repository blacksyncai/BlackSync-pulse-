import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const LEAD_STATUS_FIELD_NAME = 'leadStatus';

export type LeadStatusOption = {
  label: string;
  value: string;
  color: string;
  position: number;
};

export const useLeadStatusOptions = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const field = objectMetadataItem.fields.find(
    (candidate) => candidate.name === LEAD_STATUS_FIELD_NAME,
  );
  const options: LeadStatusOption[] = [...(field?.options ?? [])]
    .map(({ label, value, color, position }) => ({
      label,
      value,
      color,
      position,
    }))
    .sort((left, right) => left.position - right.position);

  return {
    leadStatusField: field,
    options,
    optionByValue: new Map(options.map((option) => [option.value, option])),
  };
};
