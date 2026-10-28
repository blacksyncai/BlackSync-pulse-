import { PulseBento } from '@/pulse-dashboard/components/PulseBento';
import { usePulseDashboardData } from '@/pulse-dashboard/hooks/usePulseDashboardData';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconLayoutDashboard } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledScroll = styled.div`
  background: #000;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]};
  width: 100%;
`;

const StyledLoading = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[8]};
`;

export const PulseDashboardPage = () => {
  const { t } = useLingui();
  const { data, loading } = usePulseDashboardData();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <PageCardLayout
      header={<PageHeader title={t`Dashboard`} Icon={IconLayoutDashboard} />}
    >
      <StyledScroll>
        {loading ? (
          <StyledLoading>{t`Loading your numbers...`}</StyledLoading>
        ) : (
          <PulseBento data={data} title={t`Overview`} subtitle={today} />
        )}
      </StyledScroll>
    </PageCardLayout>
  );
};
