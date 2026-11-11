import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { useSettingsActiveTabId } from '@/settings/components/layout/useSettingsActiveTabId';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { IconApps, IconCode, IconShoppingBag } from 'twenty-ui/icon';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { SettingsApplicationsClaimErrorTabEffect } from '~/pages/settings/applications/components/SettingsApplicationsClaimErrorTabEffect';
import { SettingsApplicationsAvailableTab } from '~/pages/settings/applications/tabs/SettingsApplicationsAvailableTab';
import { SettingsApplicationsDeveloperTab } from '~/pages/settings/applications/tabs/SettingsApplicationsDeveloperTab';
import { SettingsApplicationsInstalledTab } from '~/pages/settings/applications/tabs/SettingsApplicationsInstalledTab';

const APPLICATIONS_TAB_LIST_ID = 'applications-tab-list';
const DEVELOPER_TAB_ID = 'developer';

export const SettingsApplications = () => {
  const { t } = useLingui();

  const hasDeveloperAccess = useHasPermissionFlag(
    PermissionFlagType.API_KEYS_AND_WEBHOOKS,
  );

  const tabs = [
    {
      id: 'marketplace',
      title: t`Marketplace`,
      Icon: IconShoppingBag,
      pill: t`Beta`,
    },
    { id: 'installed', title: t`Installed`, Icon: IconApps },
    ...(hasDeveloperAccess
      ? [{ id: DEVELOPER_TAB_ID, title: t`Developer`, Icon: IconCode }]
      : []),
  ];

  const activeTabId = useSettingsActiveTabId(
    APPLICATIONS_TAB_LIST_ID,
    tabs.map((tab) => tab.id),
  );

  const renderActiveTabContent = () => {
    switch (activeTabId) {
      case 'marketplace':
        return <SettingsApplicationsAvailableTab />;
      case 'installed':
        return <SettingsApplicationsInstalledTab />;
      case 'developer':
        return <SettingsApplicationsDeveloperTab />;
      default:
        return <SettingsApplicationsAvailableTab />;
    }
  };

  return (
    <SettingsPageLayout
      title={t`Applications`}
      secondaryBar={
        <SettingsTabBar
          aria-label={t`Applications`}
          tabs={tabs}
          componentInstanceId={APPLICATIONS_TAB_LIST_ID}
        />
      }
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: t`Applications` },
      ]}
    >
      <SettingsApplicationsClaimErrorTabEffect
        tabListId={APPLICATIONS_TAB_LIST_ID}
        developerTabId={DEVELOPER_TAB_ID}
        hasDeveloperAccess={hasDeveloperAccess}
      />
      <SettingsPageContainer>{renderActiveTabContent()}</SettingsPageContainer>
    </SettingsPageLayout>
  );
};
