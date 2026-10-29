import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { PulseCustomFieldsEditor } from '@/pulse-customize/components/PulseCustomFieldsEditor';
import { PulseDealCardFieldsEditor } from '@/pulse-customize/components/PulseDealCardFieldsEditor';
import { PulseNotificationPreferencesEditor } from '@/pulse-customize/components/PulseNotificationPreferences';
import { PulseOptionListEditor } from '@/pulse-customize/components/PulseOptionListEditor';
import {
  type EditableSelectOption,
  useSaveSelectOptions,
} from '@/pulse-customize/hooks/useSaveSelectOptions';
import { usePulsePipelines } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPath, CoreObjectNameSingular } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components';
import { IconAdjustments } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

type SectionId =
  | 'statuses'
  | 'pipelines'
  | 'fields'
  | 'priorities'
  | 'cards'
  | 'notifications';

const StyledLayout = styled.div`
  display: flex;
  height: 100%;
  min-height: 0;
`;

const StyledMenu = styled.nav`
  border-right: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 2px;
  padding: ${themeCssVariables.spacing[4]};
  width: 220px;
`;

const StyledMenuItem = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: 8px 12px;
  text-align: left;

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[5]};
  max-width: 760px;
`;

const StyledHeading = styled.div`
  h2 {
    color: ${themeCssVariables.font.color.primary};
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 4px;
  }

  p {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.md};
    margin: 0;
  }
`;

const StyledCard = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  padding: ${themeCssVariables.spacing[4]};

  h3 {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.lg};
    font-weight: 600;
    margin: 0 0 ${themeCssVariables.spacing[3]};
  }
`;

const StyledLinkButton = styled.button`
  align-self: flex-start;
  background: ${themeCssVariables.accent.accent9};
  border: 0;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const toEditable = (
  options:
    | {
        id: string;
        label: string;
        value: string;
        color: string;
        position: number;
      }[]
    | null
    | undefined,
): EditableSelectOption[] =>
  [...(options ?? [])]
    .sort((left, right) => left.position - right.position)
    .map(({ id, label, value, color, position }) => ({
      id,
      label,
      value,
      color,
      position,
    }));

export const PulseCustomizePage = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enqueueToast } = useToast();
  const [section, setSection] = useState<SectionId>('statuses');
  const { saveSelectOptions } = useSaveSelectOptions();
  const { objectMetadataItem: companyMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const { objectMetadataItem: taskMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Task,
  });
  const { pipelines, opportunityMetadataItem } = usePulsePipelines();

  const leadStatusField = companyMetadata.fields.find(
    (field) => field.name === 'leadStatus',
  );
  const priorityField = taskMetadata.fields.find(
    (field) => field.name === 'priority',
  );

  const notifySaved = (isSaved: boolean) => {
    if (isSaved) {
      enqueueToast({ variant: 'success', children: t`Saved` });
    }

    return isSaved;
  };

  const sections: { id: SectionId; label: string }[] = [
    { id: 'statuses', label: t`Lead statuses` },
    { id: 'pipelines', label: t`Pipelines & stages` },
    { id: 'fields', label: t`Custom fields` },
    { id: 'priorities', label: t`Task priorities` },
    { id: 'cards', label: t`Deal cards` },
    { id: 'notifications', label: t`Notifications` },
  ];

  return (
    <PageCardLayout
      header={<PageHeader title={t`Customize`} Icon={IconAdjustments} />}
    >
      <StyledLayout>
        <StyledMenu>
          {sections.map((item) => (
            <StyledMenuItem
              key={item.id}
              type="button"
              aria-pressed={item.id === section}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </StyledMenuItem>
          ))}
        </StyledMenu>
        <StyledContent>
          <StyledInner>
            {section === 'statuses' && (
              <>
                <StyledHeading>
                  <h2>{t`Lead statuses`}</h2>
                  <p>{t`The stages a lead moves through, shown on the Leads list and every lead page.`}</p>
                </StyledHeading>
                <StyledCard>
                  <PulseOptionListEditor
                    key={leadStatusField?.id ?? 'new'}
                    options={toEditable(leadStatusField?.options)}
                    addLabel={t`Add status`}
                    onSave={async (options) =>
                      notifySaved(
                        await saveSelectOptions({
                          objectMetadataId: companyMetadata.id,
                          field: leadStatusField,
                          fieldName: 'leadStatus',
                          label: 'Lead status',
                          icon: 'IconProgressCheck',
                          options,
                        }),
                      )
                    }
                  />
                </StyledCard>
              </>
            )}

            {section === 'pipelines' && (
              <>
                <StyledHeading>
                  <h2>{t`Pipelines & stages`}</h2>
                  <p>{t`Rename, recolor, reorder or add stages. Changes show up on the Opportunities board right away.`}</p>
                </StyledHeading>
                <StyledLinkButton
                  type="button"
                  onClick={() => navigate(AppPath.PulsePipelines)}
                >
                  {t`New pipeline`}
                </StyledLinkButton>
                {pipelines.map((pipeline) => {
                  const stageField = opportunityMetadataItem.fields.find(
                    (field) => field.name === pipeline.stageFieldName,
                  );

                  return (
                    <StyledCard key={pipeline.viewId}>
                      <h3>{pipeline.name}</h3>
                      <PulseOptionListEditor
                        options={toEditable(stageField?.options)}
                        addLabel={t`Add stage`}
                        onSave={async (options) =>
                          notifySaved(
                            await saveSelectOptions({
                              objectMetadataId: opportunityMetadataItem.id,
                              field: stageField,
                              fieldName: pipeline.stageFieldName,
                              label: `${pipeline.name} stage`,
                              icon: 'IconProgressCheck',
                              options,
                            }),
                          )
                        }
                      />
                    </StyledCard>
                  );
                })}
              </>
            )}

            {section === 'fields' && (
              <>
                <StyledHeading>
                  <h2>{t`Custom fields`}</h2>
                  <p>{t`Track anything extra on leads, contacts and deals. New fields appear on the lead page under Details.`}</p>
                </StyledHeading>
                <StyledCard>
                  <PulseCustomFieldsEditor />
                </StyledCard>
              </>
            )}

            {section === 'priorities' && (
              <>
                <StyledHeading>
                  <h2>{t`Task priorities`}</h2>
                  <p>{t`Tasks marked with the first priority count as urgent across the to-do list, bell and reminder emails.`}</p>
                </StyledHeading>
                <StyledCard>
                  <PulseOptionListEditor
                    key={priorityField?.id ?? 'new'}
                    options={toEditable(priorityField?.options)}
                    addLabel={t`Add priority`}
                    onSave={async (options) =>
                      notifySaved(
                        await saveSelectOptions({
                          objectMetadataId: taskMetadata.id,
                          field: priorityField,
                          fieldName: 'priority',
                          label: 'Priority',
                          icon: 'IconFlag',
                          options,
                        }),
                      )
                    }
                  />
                </StyledCard>
              </>
            )}

            {section === 'cards' && (
              <>
                <StyledHeading>
                  <h2>{t`Deal cards`}</h2>
                  <p>{t`Choose what each card on the Opportunities board shows.`}</p>
                </StyledHeading>
                <StyledCard>
                  <PulseDealCardFieldsEditor />
                </StyledCard>
              </>
            )}

            {section === 'notifications' && (
              <>
                <StyledHeading>
                  <h2>{t`Notifications`}</h2>
                  <p>{t`Reminder emails for the whole team. Desktop alerts are turned on from the bell.`}</p>
                </StyledHeading>
                <StyledCard>
                  <PulseNotificationPreferencesEditor />
                </StyledCard>
              </>
            )}
          </StyledInner>
        </StyledContent>
      </StyledLayout>
    </PageCardLayout>
  );
};
