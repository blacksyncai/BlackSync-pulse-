import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconFileImport, IconInbox, IconLayoutDashboard } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.betweenSiblingsGap};
`;

export const PulseNavigationSection = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();

  return (
    <StyledSection>
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
        label={t`Import`}
        to={AppPath.PulseImport}
        Icon={IconFileImport}
        active={pathname === AppPath.PulseImport}
      />
    </StyledSection>
  );
};
