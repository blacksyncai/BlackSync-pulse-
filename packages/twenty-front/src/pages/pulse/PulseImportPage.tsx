import { useOpenObjectRecordsSpreadsheetImportDialog } from '@/object-record/spreadsheet-import/hooks/useOpenObjectRecordsSpreadsheetImportDialog';
import {
  type CloseImportCounts,
  useCloseImport,
} from '@/pulse-import/hooks/useCloseImport';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconFileImport } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const CLOSE_API_KEYS_URL = 'https://app.close.com/settings/developer/api-keys/';

const StyledScroll = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 0;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledHero = styled.section`
  background:
    radial-gradient(
      120% 140% at 0% 0%,
      ${themeCssVariables.accent.accent9} 0%,
      transparent 55%
    ),
    radial-gradient(
      90% 120% at 100% 100%,
      ${themeCssVariables.accent.accent6} 0%,
      transparent 60%
    ),
    #0b0a12;
  border-radius: 20px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[8]};
`;

const StyledEyebrow = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const StyledHeroTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
`;

const StyledHeroText = styled.p`
  color: rgba(255, 255, 255, 0.72);
  font-size: ${themeCssVariables.font.size.lg};
  margin: 0;
  max-width: 640px;
`;

const StyledChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledChip = styled.span`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 4px 12px;
`;

const StyledSteps = styled.ol`
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  margin: 0;
  padding-left: ${themeCssVariables.spacing[5]};

  a {
    color: #fff;
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledKeyInput = styled.input`
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  box-sizing: border-box;
  color: #fff;
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  height: 44px;
  min-width: 260px;
  outline: none;
  padding: 0 ${themeCssVariables.spacing[4]};

  &:focus {
    border-color: rgba(255, 255, 255, 0.5);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const StyledPrimaryButton = styled.button`
  background: #fff;
  border: 0;
  border-radius: 12px;
  color: #0b0a12;
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: 700;
  height: 44px;
  padding: 0 ${themeCssVariables.spacing[6]};

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const StyledError = styled.div`
  background: rgba(255, 80, 80, 0.16);
  border: 1px solid rgba(255, 80, 80, 0.4);
  border-radius: 12px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledProgressHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledPulseDot = styled.span`
  animation: pulseImportDot 1.2s ease-in-out infinite;
  background: #c8ff3d;
  border-radius: 50%;
  display: inline-block;
  height: 8px;
  margin-right: ${themeCssVariables.spacing[2]};
  width: 8px;

  @keyframes pulseImportDot {
    50% {
      opacity: 0.3;
    }
  }
`;

const StyledCountGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
`;

const StyledCount = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledCountValue = styled.span`
  font-size: 24px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
`;

const StyledCountLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledRemoveRow = styled.div`
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};
  padding-top: ${themeCssVariables.spacing[4]};
`;

const StyledRemoveButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 120, 120, 0.6);
  border-radius: 10px;
  color: #ffb4b4;
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 36px;
  padding: 0 ${themeCssVariables.spacing[4]};

  &[data-confirming='true'] {
    background: #e5484d;
    border-color: #e5484d;
    color: #fff;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const StyledRemoveHint = styled.span`
  color: rgba(255, 255, 255, 0.55);
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 240px;
`;

const StyledCard = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledCardTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  margin: 0;
`;

const StyledCardText = styled.p`
  color: ${themeCssVariables.font.color.tertiary};
  margin: 0;
`;

const StyledButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSecondaryButton = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 36px;
  padding: 0 ${themeCssVariables.spacing[4]};

  &:hover {
    border-color: ${themeCssVariables.accent.accent9};
  }
`;

const getErrorMessage = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors[0]?.message;
  }

  return error instanceof Error ? error.message : undefined;
};

const SpreadsheetImportButton = ({
  objectNameSingular,
  label,
}: {
  objectNameSingular: string;
  label: string;
}) => {
  const { openObjectRecordsSpreadsheetImportDialog } =
    useOpenObjectRecordsSpreadsheetImportDialog(objectNameSingular);

  return (
    <StyledSecondaryButton
      type="button"
      onClick={() => openObjectRecordsSpreadsheetImportDialog()}
    >
      {label}
    </StyledSecondaryButton>
  );
};

export const PulseImportPage = () => {
  const { t } = useLingui();
  const {
    status,
    isStarting,
    isRemoving,
    startCloseImport,
    removeCloseImport,
  } = useCloseImport();
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isRunning = status?.state === 'running';
  const isRemovingData =
    isRunning && status.currentStep === 'Removing imported data';

  const handleRemove = async () => {
    if (!isConfirmingRemoval) {
      setIsConfirmingRemoval(true);

      return;
    }

    setIsConfirmingRemoval(false);
    setSubmitError(null);

    try {
      await removeCloseImport();
    } catch (error) {
      setSubmitError(
        getErrorMessage(error) ?? t`Could not remove the import. Try again.`,
      );
    }
  };

  const countLabels: { key: keyof CloseImportCounts; label: string }[] = [
    { key: 'companies', label: t`Accounts` },
    { key: 'people', label: t`People` },
    { key: 'opportunities', label: t`Deals` },
    { key: 'notes', label: t`Notes` },
    { key: 'calls', label: t`Calls` },
    { key: 'emails', label: t`Emails` },
    { key: 'texts', label: t`Texts` },
    { key: 'tasks', label: t`Tasks` },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await startCloseImport(apiKey);
      setApiKey('');
    } catch (error) {
      setSubmitError(
        getErrorMessage(error) ?? t`Could not start the import. Try again.`,
      );
    }
  };

  const showProgress = isDefined(status) && status.state !== 'idle';

  return (
    <PageCardLayout
      header={<PageHeader title={t`Import`} Icon={IconFileImport} />}
    >
      <StyledScroll>
        <StyledHero>
          <StyledEyebrow>{t`Switch in minutes`}</StyledEyebrow>
          <StyledHeroTitle>{t`Migrate from Close`}</StyledHeroTitle>
          <StyledHeroText>
            {t`Bring your whole Close account over in one go. Your Close pipelines, stages and lead statuses are rebuilt here exactly, and every deal lands in the same stage. Running it again only adds what's new.`}
          </StyledHeroText>
          <StyledChips>
            {[
              t`Pipelines + stages`,
              t`Lead statuses`,
              t`Leads → Accounts`,
              t`Contacts → People`,
              t`Opportunities → Deals`,
              t`Notes`,
              t`Calls + recordings`,
              t`Emails`,
              t`Texts`,
              t`Tasks`,
            ].map((label) => (
              <StyledChip key={label}>{label}</StyledChip>
            ))}
          </StyledChips>

          {showProgress && (
            <>
              <StyledProgressHeader>
                <strong>
                  {isRunning && <StyledPulseDot />}
                  {isRemovingData
                    ? t`Removing everything imported from Close...`
                    : isRunning
                      ? t`Importing ${status.currentStep ?? ''} from ${status.organizationName ?? 'Close'}...`
                      : status.state === 'done'
                        ? t`Imported from ${status.organizationName ?? 'Close'}`
                        : t`Import stopped`}
                </strong>
              </StyledProgressHeader>
              <StyledCountGrid>
                {countLabels.map(({ key, label }) => (
                  <StyledCount key={key}>
                    <StyledCountValue>
                      {status.counts[key].toLocaleString()}
                    </StyledCountValue>
                    <StyledCountLabel>{label}</StyledCountLabel>
                  </StyledCount>
                ))}
              </StyledCountGrid>
              {status.state === 'failed' && isDefined(status.error) && (
                <StyledError>{status.error}</StyledError>
              )}
            </>
          )}

          {!isRunning && (
            <>
              <StyledSteps>
                <li>
                  {t`In Close, open`}{' '}
                  <a href={CLOSE_API_KEYS_URL} target="_blank" rel="noreferrer">
                    {t`Settings → Developer → API Keys`}
                  </a>{' '}
                  {t`and create a new key.`}
                </li>
                <li>{t`Paste it below and start the migration.`}</li>
              </StyledSteps>
              <StyledForm onSubmit={handleSubmit}>
                <StyledKeyInput
                  type="password"
                  autoComplete="off"
                  placeholder={t`Close API key (api_...)`}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
                <StyledPrimaryButton
                  type="submit"
                  disabled={apiKey.trim().length === 0 || isStarting}
                >
                  {isStarting
                    ? t`Connecting...`
                    : status?.state === 'done'
                      ? t`Sync again`
                      : t`Start migration`}
                </StyledPrimaryButton>
              </StyledForm>
              {isDefined(submitError) && (
                <StyledError>{submitError}</StyledError>
              )}
              <StyledRemoveRow>
                <StyledRemoveButton
                  type="button"
                  disabled={isRemoving}
                  data-confirming={isConfirmingRemoval}
                  onClick={handleRemove}
                  onBlur={() => setIsConfirmingRemoval(false)}
                >
                  {isConfirmingRemoval
                    ? t`Click again to delete everything imported from Close`
                    : t`Remove imported data`}
                </StyledRemoveButton>
                <StyledRemoveHint>
                  {t`Deletes the accounts, people, deals, notes, calls, emails, texts and tasks any Close import created, so you can sync again from scratch. Records you made yourself stay.`}
                </StyledRemoveHint>
              </StyledRemoveRow>
            </>
          )}
        </StyledHero>

        <StyledCard>
          <StyledCardTitle>{t`Spreadsheet or another CRM`}</StyledCardTitle>
          <StyledCardText>
            {t`Upload a CSV or Excel export from Salesforce, HubSpot, Pipedrive, Follow Up Boss or anywhere else. You map the columns, we do the rest.`}
          </StyledCardText>
          <StyledButtonRow>
            <SpreadsheetImportButton
              objectNameSingular={CoreObjectNameSingular.Company}
              label={t`Import accounts`}
            />
            <SpreadsheetImportButton
              objectNameSingular={CoreObjectNameSingular.Person}
              label={t`Import people`}
            />
            <SpreadsheetImportButton
              objectNameSingular={CoreObjectNameSingular.Opportunity}
              label={t`Import deals`}
            />
            <SpreadsheetImportButton
              objectNameSingular={CoreObjectNameSingular.Task}
              label={t`Import tasks`}
            />
          </StyledButtonRow>
        </StyledCard>
      </StyledScroll>
    </PageCardLayout>
  );
};
