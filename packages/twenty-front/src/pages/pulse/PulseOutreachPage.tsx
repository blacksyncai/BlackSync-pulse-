import { StyledBanner } from '@/pulse-outreach/components/PulseOutreachStyles';
import { PulseSequencesEditor } from '@/pulse-outreach/components/PulseSequencesEditor';
import { PulseTemplatesEditor } from '@/pulse-outreach/components/PulseTemplatesEditor';
import { useOutreachStatus } from '@/pulse-outreach/hooks/usePulseOutreach';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useSearchParams } from 'react-router-dom';
import { IconMail } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

type Tab = 'templates' | 'sequences';

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  height: 100%;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]} ${themeCssVariables.spacing[6]};
`;

const StyledTabs = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
`;

const StyledTab = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.lg};
  padding: 8px 14px;

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.semiBold};
  }
`;

const StyledFrom = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const PulseOutreachPage = () => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab =
    searchParams.get('tab') === 'sequences' ? 'sequences' : 'templates';
  const status = useOutreachStatus();

  return (
    <PageCardLayout
      header={<PageHeader title={t`Templates & sequences`} Icon={IconMail} />}
    >
      <StyledPage>
        {status?.canSend === false && (
          <StyledBanner>
            {t`Sending is not switched on yet. You can build templates and sequences now; emails start going out once the Resend key is added.`}
          </StyledBanner>
        )}
        <StyledTabs>
          <div>
            <StyledTab
              type="button"
              aria-pressed={tab === 'templates'}
              onClick={() => setSearchParams({ tab: 'templates' })}
            >
              {t`Templates`}
            </StyledTab>
            <StyledTab
              type="button"
              aria-pressed={tab === 'sequences'}
              onClick={() => setSearchParams({ tab: 'sequences' })}
            >
              {t`Sequences`}
            </StyledTab>
          </div>
          {status?.canSend === true && (
            <StyledFrom>
              {t`Sends as ${status.fromAddress}, replies go to ${status.replyTo}`}
            </StyledFrom>
          )}
        </StyledTabs>
        {tab === 'templates' ? (
          <PulseTemplatesEditor />
        ) : (
          <PulseSequencesEditor />
        )}
      </StyledPage>
    </PageCardLayout>
  );
};
