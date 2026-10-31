import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useCreateOneFieldMetadataItem } from '@/object-metadata/hooks/useCreateOneFieldMetadataItem';
import { useUpdateOneFieldMetadataItem } from '@/object-metadata/hooks/useUpdateOneFieldMetadataItem';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type EditableSelectOption = {
  id: string;
  label: string;
  value: string;
  color: string;
  position: number;
};

export const useSaveSelectOptions = () => {
  const { updateOneFieldMetadataItem } = useUpdateOneFieldMetadataItem();
  const { createOneFieldMetadataItem } = useCreateOneFieldMetadataItem();

  // Creates the field the first time, so a workspace without it can still be set up here.
  const saveSelectOptions = async ({
    objectMetadataId,
    field,
    fieldName,
    label,
    icon,
    options,
    fieldType = FieldMetadataType.SELECT,
  }: {
    objectMetadataId: string;
    field: FieldMetadataItem | undefined;
    fieldName: string;
    label: string;
    icon: string;
    options: EditableSelectOption[];
    fieldType?: FieldMetadataType.SELECT | FieldMetadataType.MULTI_SELECT;
  }) => {
    const normalized = options.map((option, position) => ({
      id: option.id,
      label: option.label.trim(),
      value: option.value,
      color: option.color,
      position,
    }));

    if (isDefined(field)) {
      const result = await updateOneFieldMetadataItem({
        objectMetadataId,
        fieldMetadataIdToUpdate: field.id,
        updatePayload: { options: normalized },
      });

      return result.status === 'successful';
    }

    const result = await createOneFieldMetadataItem({
      objectMetadataId,
      type: fieldType,
      name: fieldName,
      label,
      icon,
      isNullable: true,
      options: normalized,
    });

    return result.status === 'successful';
  };

  return { saveSelectOptions };
};
