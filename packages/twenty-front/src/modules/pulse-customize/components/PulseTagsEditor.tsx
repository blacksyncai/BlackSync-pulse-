import { useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import { styled } from '@linaria/react';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { PulseOptionListEditor } from '@/pulse-customize/components/PulseOptionListEditor';
import { useSaveSelectOptions } from '@/pulse-customize/hooks/useSaveSelectOptions';

const StyledTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  button {
    background: transparent;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.secondary};
    padding: 8px 12px;
    cursor: pointer;
    font: inherit;
  }
  button[aria-pressed='true'] {
    background: ${themeCssVariables.accent.quaternary};
    color: ${themeCssVariables.accent.accent11};
  }
`;
export const PulseTagsEditor = () => {
  const { t } = useLingui();
  const [objectNameSingular, setObjectNameSingular] =
    useState<CoreObjectNameSingular>(CoreObjectNameSingular.Company);
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const { saveSelectOptions } = useSaveSelectOptions();
  const { enqueueToast } = useToast();
  const field = objectMetadataItem.fields.find((item) => item.name === 'tags');
  const objects = [
    { name: CoreObjectNameSingular.Company, label: t`Leads` },
    { name: CoreObjectNameSingular.Person, label: t`Contacts` },
    { name: CoreObjectNameSingular.Opportunity, label: t`Deals` },
  ];
  return (
    <>
      <StyledTabs aria-label={t`Tag record type`}>
        {objects.map((item) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={objectNameSingular === item.name}
            onClick={() => setObjectNameSingular(item.name)}
          >
            {item.label}
          </button>
        ))}
      </StyledTabs>
      {field && field.type !== FieldMetadataType.MULTI_SELECT ? (
        <p>{t`A field named tags already exists with another type. Review it under Custom fields before creating multi-select tags.`}</p>
      ) : (
        <PulseOptionListEditor
          key={`${objectMetadataItem.id}-${field?.id ?? 'new'}`}
          options={[...(field?.options ?? [])].sort(
            (left, right) => left.position - right.position,
          )}
          addLabel={t`Add tag`}
          onSave={async (options) => {
            const saved = await saveSelectOptions({
              objectMetadataId: objectMetadataItem.id,
              field,
              fieldName: 'tags',
              label: t`Tags`,
              icon: 'IconTags',
              fieldType: FieldMetadataType.MULTI_SELECT,
              options,
            });
            enqueueToast({
              message: saved ? t`Tags saved` : t`Could not save tags`,
              variant: saved ? 'success' : 'error',
            });
          }}
        />
      )}
    </>
  );
};
