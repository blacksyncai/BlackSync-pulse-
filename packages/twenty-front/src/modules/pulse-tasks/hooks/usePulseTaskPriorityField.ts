import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const PRIORITY_FIELD_NAME = 'priority';

// The server adds a Priority field to tasks in every workspace; until then urgency is hidden.
export const usePulseTaskPriorityField = () => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const priorityField = objectMetadataItem.fields.find(
    (field) => field.name === PRIORITY_FIELD_NAME && field.isActive !== false,
  );

  return {
    hasPriority: priorityField !== undefined,
    priorityOptions: priorityField?.options ?? [],
  };
};
