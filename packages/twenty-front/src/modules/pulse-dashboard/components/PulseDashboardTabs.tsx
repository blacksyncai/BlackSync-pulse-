import { PULSE_ANALYTICS_PATH } from '@/pulse-dashboard/constants/PulseAnalyticsPath';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link, useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledTabs = styled.nav`
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[5]};
  padding: 0 ${themeCssVariables.spacing[6]};

  a {
    border-bottom: 2px solid transparent;
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.md};
    font-weight: ${themeCssVariables.font.weight.medium};
    padding: 12px 0;
    text-decoration: none;
  }

  a[aria-current='page'] {
    border-bottom-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }
`;

export const PulseDashboardTabs = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const isAnalytics = pathname === PULSE_ANALYTICS_PATH;

  return (
    <StyledTabs aria-label={t`Dashboard sections`}>
      <Link
        to={AppPath.PulseDashboard}
        aria-current={!isAnalytics ? 'page' : undefined}
      >
        {t`Dashboard`}
      </Link>
      <Link
        to={PULSE_ANALYTICS_PATH}
        aria-current={isAnalytics ? 'page' : undefined}
      >
        {t`Analytics`}
      </Link>
    </StyledTabs>
  );
};
