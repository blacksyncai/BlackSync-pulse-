import { useSmartViews } from '@/pulse-leads/hooks/useSmartViews';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';
import { NavigationDrawerSubItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSubItem';
import { getNavigationSubItemLeftAdornment } from '@/ui/navigation/navigation-drawer/utils/getNavigationSubItemLeftAdornment';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  IconAdjustments,
  IconApi,
  IconBuildingSkyscraper,
  IconCheckbox,
  IconFileImport,
  IconInbox,
  IconLayoutDashboard,
  IconMail,
  IconPhone,
  IconTargetArrow,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.betweenSiblingsGap};
`;

const StyledGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const PulseNavigationSection = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { smartViews } = useSmartViews();
  const isOnLeads = pathname === AppPath.PulseLeads;
  const activeViewId = isOnLeads
    ? (searchParams.get('view') ?? smartViews[0]?.id)
    : null;
  const selectedViewIndex = smartViews.findIndex(
    (view) => view.id === activeViewId,
  );

  return (
    <StyledSection>
      <StyledGroup>
        <NavigationDrawerSectionTitle label={t`Sell`} />
        <NavigationDrawerItem
          label={t`Dashboard`}
          to={AppPath.PulseDashboard}
          Icon={IconLayoutDashboard}
          active={pathname === AppPath.PulseDashboard}
        />
        <NavigationDrawerItem
          label={t`Inbox`}
          to={AppPath.PulseInbox}
          Icon={IconInbox}
          active={pathname === AppPath.PulseInbox}
        />
        <NavigationDrawerItem
          label={t`Leads`}
          to={AppPath.PulseLeads}
          Icon={IconBuildingSkyscraper}
          active={isOnLeads && selectedViewIndex <= 0}
        />
        {smartViews.slice(1).map((view, index) => (
          <NavigationDrawerSubItem
            key={view.id}
            label={view.name}
            to={`${AppPath.PulseLeads}?view=${view.id}`}
            active={view.id === activeViewId}
            subItemState={getNavigationSubItemLeftAdornment({
              index,
              arrayLength: smartViews.length - 1,
              selectedIndex: selectedViewIndex - 1,
            })}
          />
        ))}
        <NavigationDrawerItem
          label={t`Power dialer`}
          to={AppPath.PulseDialer}
          Icon={IconPhone}
          active={pathname === AppPath.PulseDialer}
        />
        <NavigationDrawerItem
          label={t`Opportunities`}
          to={AppPath.PulseOpportunities}
          Icon={IconTargetArrow}
          active={pathname === AppPath.PulseOpportunities}
        />
        <NavigationDrawerItem
          label={t`To-do`}
          to={AppPath.PulseTodo}
          Icon={IconCheckbox}
          active={pathname === AppPath.PulseTodo}
        />
      </StyledGroup>
      <StyledGroup>
        <NavigationDrawerSectionTitle label={t`Outreach`} />
        <NavigationDrawerItem
          label={t`Templates & sequences`}
          to={AppPath.PulseOutreach}
          Icon={IconMail}
          active={pathname === AppPath.PulseOutreach}
        />
      </StyledGroup>
      <StyledGroup>
        <NavigationDrawerSectionTitle label={t`Setup`} />
        <NavigationDrawerItem
          label={t`Connect & automate`}
          to={getSettingsPath(SettingsPath.ApiWebhooks)}
          Icon={IconApi}
          active={pathname.startsWith(
            getSettingsPath(SettingsPath.ApiWebhooks),
          )}
        />
        <NavigationDrawerItem
          label={t`Customize`}
          to={AppPath.PulseCustomize}
          Icon={IconAdjustments}
          active={pathname === AppPath.PulseCustomize}
        />
        <NavigationDrawerItem
          label={t`Import`}
          to={AppPath.PulseImport}
          Icon={IconFileImport}
          active={pathname === AppPath.PulseImport}
        />
      </StyledGroup>
    </StyledSection>
  );
};
