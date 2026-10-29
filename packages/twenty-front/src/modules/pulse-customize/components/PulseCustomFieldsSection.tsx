import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useIsWorkspaceCustomField } from '@/pulse-customize/hooks/useIsWorkspaceCustomField';
import { PULSE_MANAGED_FIELD_NAMES } from '@/pulse-customize/constants/PulseCustomizableObjects';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const SUPPORTED_TYPES: string[] = [
  FieldMetadataType.TEXT,
  FieldMetadataType.NUMBER,
  FieldMetadataType.CURRENCY,
  FieldMetadataType.DATE,
  FieldMetadataType.SELECT,
  FieldMetadataType.MULTI_SELECT,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.LINKS,
];

const StyledField = styled.div`
  align-items: center;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 110px 1fr;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};

  & + & {
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }

  > span {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.sm};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  input:not([type='checkbox']),
  select {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 30px;
    min-width: 0;
    padding: 0 ${themeCssVariables.spacing[1]};
    width: 100%;
  }

  input:not([type='checkbox']):hover,
  input:not([type='checkbox']):focus,
  select:hover,
  select:focus {
    border-color: ${themeCssVariables.border.color.medium};
    outline: none;
  }
`;

const StyledChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  button {
    background: transparent;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 999px;
    color: ${themeCssVariables.font.color.secondary};
    cursor: pointer;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.sm};
    padding: 2px 8px;
  }

  button[aria-pressed='true'] {
    background: ${themeCssVariables.accent.quaternary};
    border-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }
`;

type PulseCustomFieldsSectionProps = {
  objectNameSingular: string;
  recordId: string;
};

export const PulseCustomFieldsSection = ({
  objectNameSingular,
  recordId,
}: PulseCustomFieldsSectionProps) => {
  const { t } = useLingui();
  const isWorkspaceCustomField = useIsWorkspaceCustomField();
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const { updateOneRecord } = useUpdateOneRecord();
  const fields = objectMetadataItem.fields.filter(
    (field) =>
      isWorkspaceCustomField(field) &&
      field.isActive !== false &&
      SUPPORTED_TYPES.includes(field.type) &&
      !PULSE_MANAGED_FIELD_NAMES.includes(field.name) &&
      !field.name.endsWith('Stage'),
  );
  const { record } = useFindOneRecord<ObjectRecord>({
    objectNameSingular,
    objectRecordId: recordId,
    recordGqlFields: Object.fromEntries([
      ['id', true],
      ...fields.map((field) => [field.name, true]),
    ]),
    skip: fields.length === 0,
  });

  if (fields.length === 0) {
    return null;
  }

  const save = (fieldName: string, value: unknown) =>
    void updateOneRecord({
      objectNameSingular,
      idToUpdate: recordId,
      updateOneRecordInput: { [fieldName]: value },
    });

  return (
    <>
      {fields.map((field) => {
        const value = record?.[field.name];
        const options = [...(field.options ?? [])].sort(
          (left, right) => left.position - right.position,
        );
        const key = `${field.id}:${JSON.stringify(value ?? null)}`;

        switch (field.type) {
          case FieldMetadataType.BOOLEAN:
            return (
              <StyledField key={key}>
                <span>{field.label}</span>
                <input
                  aria-label={field.label}
                  type="checkbox"
                  defaultChecked={value === true}
                  onChange={(event) => save(field.name, event.target.checked)}
                />
              </StyledField>
            );
          case FieldMetadataType.SELECT:
            return (
              <StyledField key={key}>
                <span>{field.label}</span>
                <select
                  aria-label={field.label}
                  defaultValue={typeof value === 'string' ? value : ''}
                  onChange={(event) =>
                    save(field.name, event.target.value || null)
                  }
                >
                  <option value="">{t`Empty`}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </StyledField>
            );
          case FieldMetadataType.MULTI_SELECT: {
            const selected = Array.isArray(value) ? (value as string[]) : [];

            return (
              <StyledField key={key}>
                <span>{field.label}</span>
                <StyledChips>
                  {options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected.includes(option.value)}
                      onClick={() =>
                        save(
                          field.name,
                          selected.includes(option.value)
                            ? selected.filter((item) => item !== option.value)
                            : [...selected, option.value],
                        )
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </StyledChips>
              </StyledField>
            );
          }
          case FieldMetadataType.CURRENCY: {
            const amountMicros = (value as { amountMicros?: number } | null)
              ?.amountMicros;

            return (
              <StyledField key={key}>
                <span>{field.label}</span>
                <input
                  aria-label={field.label}
                  type="number"
                  placeholder="$0"
                  defaultValue={
                    isDefined(amountMicros) ? amountMicros / 1_000_000 : ''
                  }
                  onBlur={(event) =>
                    save(field.name, {
                      amountMicros:
                        event.target.value === ''
                          ? null
                          : Math.round(Number(event.target.value) * 1_000_000),
                      currencyCode: 'USD',
                    })
                  }
                />
              </StyledField>
            );
          }
          case FieldMetadataType.LINKS: {
            const url = (value as { primaryLinkUrl?: string } | null)
              ?.primaryLinkUrl;

            return (
              <StyledField key={key}>
                <span>{field.label}</span>
                <input
                  aria-label={field.label}
                  type="url"
                  placeholder="https://"
                  defaultValue={url ?? ''}
                  onBlur={(event) =>
                    save(field.name, {
                      primaryLinkUrl: event.target.value,
                      primaryLinkLabel: '',
                      secondaryLinks: null,
                    })
                  }
                />
              </StyledField>
            );
          }
          default: {
            const inputType =
              field.type === FieldMetadataType.NUMBER
                ? 'number'
                : field.type === FieldMetadataType.DATE
                  ? 'date'
                  : 'text';

            return (
              <StyledField key={key}>
                <span>{field.label}</span>
                <input
                  aria-label={field.label}
                  type={inputType}
                  placeholder={t`Empty`}
                  defaultValue={
                    value === null || value === undefined ? '' : String(value)
                  }
                  onBlur={(event) => {
                    const raw = event.target.value;

                    save(
                      field.name,
                      raw === ''
                        ? null
                        : inputType === 'number'
                          ? Number(raw)
                          : raw,
                    );
                  }}
                />
              </StyledField>
            );
          }
        }
      })}
    </>
  );
};
