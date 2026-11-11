import { SettingsActionCard } from '@/settings/components/SettingsActionCard';
import { useEnterLayoutCustomizationMode } from '@/layout-customization/hooks/useEnterLayoutCustomizationMode';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsDiscoveryHeroCardFooter } from '@/settings/components/SettingsDiscoveryHeroCardFooter';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsLayoutItemsStats } from '@/settings/layout/components/SettingsLayoutItemsStats';
import { useLingui } from '@lingui/react/macro';
import { useNavigate } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components';
import { IconLayoutDashboard, IconPencil } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

export const SettingsLayout = () => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const { enterLayoutCustomizationMode } = useEnterLayoutCustomizationMode();

  const handleCustomize = () => {
    if (enterLayoutCustomizationMode()) {
      navigate(AppPath.Index);
    }
  };

  return (
    <SettingsPageLayout
      title={t`Layout`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: t`Layout` },
      ]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <SettingsActionCard>
            <SettingsDiscoveryHeroCardFooter
              Icon={IconLayoutDashboard}
              title={t`Customize layout`}
              description={t`Customize how your workspace looks.`}
              action={
                <Button
                  size="sm"
                  startIcon={<IconPencil />}
                  onClick={handleCustomize}
                  variant="solid"
                  color="accent"
                >{t`Customize`}</Button>
              }
            />
          </SettingsActionCard>
        </Section.Root>
        <Section.Root>
          <Section.Header
            title={t`Overview`}
            description={t`All the layout items declared on your workspace`}
          />
          <SettingsLayoutItemsStats />
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
