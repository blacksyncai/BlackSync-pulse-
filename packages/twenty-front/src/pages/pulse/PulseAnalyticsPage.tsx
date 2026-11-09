import { PulseBento } from '@/pulse-dashboard/components/PulseBento';
import { PulseDashboardTabs } from '@/pulse-dashboard/components/PulseDashboardTabs';
import { usePulseDashboardData } from '@/pulse-dashboard/hooks/usePulseDashboardData';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconLayoutDashboard } from 'twenty-ui/icon';
const StyledPage = styled.div`
  background: #101014;
  color: #fff;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  width: 100%;
  @media (max-width: 600px) {
    padding: 12px;
  }
`;
const StyledToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  select,
  button,
  a {
    background: #23232d;
    color: #fff;
    border: 1px solid #454252;
    border-radius: 9px;
    padding: 8px 12px;
    font: inherit;
    text-decoration: none;
    max-width: 100%;
  }
  button:disabled {
    opacity: 0.5;
  }
`;
const StyledNotice = styled.p`
  color: #c4c2d2;
  font-size: 13px;
  line-height: 1.5;
  margin: 12px 0;
`;
export const PulseAnalyticsPage = () => {
  const { t } = useLingui();
  const [pipelineId, setPipelineId] = useState('all');
  const [currency, setCurrency] = useState('');
  const {
    data,
    pipelines,
    currencies,
    currencyCode,
    loading,
    error,
    totalCount,
    loadedCount,
    hasNextPage,
    loadMore,
    refresh,
  } = usePulseDashboardData(pipelineId, currency);
  return (
    <PageCardLayout
      header={<PageHeader title={t`Analytics`} Icon={IconLayoutDashboard} />}
      secondaryBar={<PulseDashboardTabs />}
    >
      <StyledPage>
        <StyledToolbar>
          <select
            aria-label={t`Analytics pipeline`}
            value={pipelineId}
            onChange={(event) => setPipelineId(event.target.value)}
          >
            <option value="all">{t`All pipelines`}</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.viewId} value={pipeline.viewId}>
                {pipeline.name}
              </option>
            ))}
          </select>
          <select
            aria-label={t`Analytics currency`}
            value={currencyCode}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={loading}
            onClick={() => void refresh().catch(() => undefined)}
          >
            {loading ? t`Refreshing…` : t`Refresh analytics`}
          </button>
          <span>{t`${data.peopleCount} contacts · ${data.companyCount} accounts`}</span>
        </StyledToolbar>
        {error ? (
          <StyledNotice role="alert">{t`Some analytics could not be loaded. Refresh to try again.`}</StyledNotice>
        ) : loading ? (
          <StyledNotice role="status">{t`Updating analytics…`}</StyledNotice>
        ) : null}
        {hasNextPage && (
          <StyledNotice>
            {t`Sales charts show ${loadedCount} loaded deals out of ${totalCount ?? loadedCount}.`}{' '}
            <button
              type="button"
              disabled={loading}
              onClick={() => void loadMore().catch(() => undefined)}
            >{t`Load more deals`}</button>
          </StyledNotice>
        )}
        {!error && (
          <PulseBento
            data={data}
            title={t`Sales analytics`}
            subtitle={t`Pipeline, sales results, calls and activity`}
          />
        )}
        <StyledNotice>{t`Sales charts use the selected pipeline and currency. Monthly deal-value charts group deals by creation month and show their current stage; they are not historical pipeline snapshots. Won-by-month uses recorded close dates. Calls, tasks, contacts and meetings cover the workspace.`}</StyledNotice>
      </StyledPage>
    </PageCardLayout>
  );
};
