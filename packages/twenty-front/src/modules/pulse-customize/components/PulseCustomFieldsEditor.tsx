import { useCreateOneFieldMetadataItem } from '@/object-metadata/hooks/useCreateOneFieldMetadataItem';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useUpdateOneFieldMetadataItem } from '@/object-metadata/hooks/useUpdateOneFieldMetadataItem';
import { useIsWorkspaceCustomField } from '@/pulse-customize/hooks/useIsWorkspaceCustomField';
import {
  PULSE_CUSTOMIZABLE_OBJECTS,
  PULSE_FIELD_TYPES,
  PULSE_MANAGED_FIELD_NAMES,
} from '@/pulse-customize/constants/PulseCustomizableObjects';
import { PULSE_TAG_COLORS } from '@/pulse-customize/constants/PulseTagColors';
import {
  makeUnique,
  toCamelCaseFieldName,
  toSelectOptionValue,
} from '@/pulse-pipelines/utils/buildPulsePipelineIdentifiers';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FieldMetadataType } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { v4 } from 'uuid';

const StyledTabs = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledTab = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: 6px 12px;

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledFieldRow = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[2]} 0;

  span:first-child {
    color: ${themeCssVariables.font.color.primary};
    flex: 1;
    font-size: ${themeCssVariables.font.size.md};
  }

  span:nth-child(2) {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.sm};
  }
`;

const StyledForm = styled.form`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-top: ${themeCssVariables.spacing[3]};

  input,
  select {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 34px;
    padding: 0 ${themeCssVariables.spacing[2]};
  }

  input[name='label'] {
    flex: 1;
    min-width: 180px;
  }

  input[name='options'] {
    flex: 2;
    min-width: 240px;
  }

  button {
    align-items: center;
    background: ${themeCssVariables.accent.accent9};
    border: 0;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    font-weight: ${themeCssVariables.font.weight.medium};
    gap: 4px;
    height: 34px;
    padding: 0 ${themeCssVariables.spacing[3]};
  }
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const typeLabel = (type: string) =>
  PULSE_FIELD_TYPES.find((fieldType) => fieldType.type === type)?.label ??
  type.toLowerCase();

export const PulseCustomFieldsEditor = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [objectName, setObjectName] = useState<string>(
    PULSE_CUSTOMIZABLE_OBJECTS[0].nameSingular,
  );
  const isWorkspaceCustomField = useIsWorkspaceCustomField();
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: objectName,
  });
  const { createOneFieldMetadataItem } = useCreateOneFieldMetadataItem();
  const { updateOneFieldMetadataItem } = useUpdateOneFieldMetadataItem();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<string>(FieldMetadataType.TEXT);
  const [optionsText, setOptionsText] = useState('');

  const customFields = objectMetadataItem.fields.filter(
    (field) =>
      isWorkspaceCustomField(field) &&
      field.isActive !== false &&
      !PULSE_MANAGED_FIELD_NAMES.includes(field.name) &&
      !field.name.endsWith('Stage'),
  );
  const isSelectType =
    type === FieldMetadataType.SELECT ||
    type === FieldMetadataType.MULTI_SELECT;

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = label.trim();

    if (trimmed.length === 0) {
      return;
    }

    const optionLabels = optionsText
      .split(',')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    if (isSelectType && optionLabels.length === 0) {
      enqueueToast({
        variant: 'error',
        children: t`Add at least one option, separated by commas.`,
      });

      return;
    }

    const takenValues: string[] = [];
    const fieldType = PULSE_FIELD_TYPES.find(
      (candidate) => candidate.type === type,
    );
    const result = await createOneFieldMetadataItem({
      objectMetadataId: objectMetadataItem.id,
      type: type as FieldMetadataType,
      name: makeUnique(
        toCamelCaseFieldName(trimmed),
        objectMetadataItem.fields.map((field) => field.name),
      ),
      label: trimmed,
      icon: fieldType?.icon ?? 'IconAbc',
      isNullable: true,
      ...(isSelectType
        ? {
            options: optionLabels.map((optionLabel, position) => {
              const value = makeUnique(
                toSelectOptionValue(optionLabel),
                takenValues,
              );

              takenValues.push(value);

              return {
                id: v4(),
                label: optionLabel,
                value,
                color:
                  PULSE_TAG_COLORS[(position + 1) % PULSE_TAG_COLORS.length],
                position,
              };
            }),
          }
        : {}),
    });

    if (result.status === 'successful') {
      enqueueToast({ variant: 'success', children: t`Added "${trimmed}"` });
      setLabel('');
      setOptionsText('');
    }
  };

  const handleRemove = async (fieldId: string, fieldLabel: string) => {
    if (
      !window.confirm(
        t`Remove "${fieldLabel}"? It disappears everywhere, but its values are kept and it can be restored.`,
      )
    ) {
      return;
    }

    await updateOneFieldMetadataItem({
      objectMetadataId: objectMetadataItem.id,
      fieldMetadataIdToUpdate: fieldId,
      updatePayload: { isActive: false },
    });
  };

  return (
    <div>
      <StyledTabs>
        {PULSE_CUSTOMIZABLE_OBJECTS.map((object) => (
          <StyledTab
            key={object.nameSingular}
            type="button"
            aria-pressed={object.nameSingular === objectName}
            onClick={() => setObjectName(object.nameSingular)}
          >
            {object.label}
          </StyledTab>
        ))}
      </StyledTabs>

      {customFields.length === 0 ? (
        <StyledMuted>{t`No custom fields yet.`}</StyledMuted>
      ) : (
        customFields.map((field) => (
          <StyledFieldRow key={field.id}>
            <span>{field.label}</span>
            <span>{typeLabel(field.type)}</span>
            <StyledIconButton
              type="button"
              aria-label={t`Remove ${field.label}`}
              onClick={() => void handleRemove(field.id, field.label)}
            >
              <IconTrash size={16} />
            </StyledIconButton>
          </StyledFieldRow>
        ))
      )}

      <StyledForm onSubmit={handleCreate}>
        <input
          name="label"
          aria-label={t`Field name`}
          placeholder={t`New field name, e.g. Team size`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <select
          aria-label={t`Field type`}
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {PULSE_FIELD_TYPES.map((fieldType) => (
            <option key={fieldType.type} value={fieldType.type}>
              {fieldType.label}
            </option>
          ))}
        </select>
        {isSelectType && (
          <input
            name="options"
            aria-label={t`Options`}
            placeholder={t`Options, comma separated: Solo, 2-10, 11-50`}
            value={optionsText}
            onChange={(event) => setOptionsText(event.target.value)}
          />
        )}
        <button type="submit">
          <IconPlus size={14} />
          {t`Add field`}
        </button>
      </StyledForm>
    </div>
  );
};
