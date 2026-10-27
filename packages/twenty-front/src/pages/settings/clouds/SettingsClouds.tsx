import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { PulseCloudTiles } from '@/pulse-clouds/components/PulseCloudTiles';
import { PULSE_CLOUDS } from '@/pulse-clouds/constants/PulseClouds';
import { useInstallPulseClouds } from '@/pulse-clouds/hooks/useInstallPulseClouds';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isNonEmptyArray } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components';
import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

export const SettingsClouds = () => {
  const { t } = useLingui();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { installClouds, isInstalling } = useInstallPulseClouds();
  const [selectedUniversalIdentifiers, setSelectedUniversalIdentifiers] =
    useState<string[]>([]);
  const [
    justInstalledUniversalIdentifiers,
    setJustInstalledUniversalIdentifiers,
  ] = useState<string[]>([]);

  const installedUniversalIdentifiers = [
    ...(currentWorkspace?.installedApplications ?? [])
      .map((application) => application.universalIdentifier)
      .filter((universalIdentifier) =>
        PULSE_CLOUDS.some(
          (cloud) => cloud.universalIdentifier === universalIdentifier,
        ),
      ),
    ...justInstalledUniversalIdentifiers,
  ];

  const toggleCloud = (universalIdentifier: string) => {
    setSelectedUniversalIdentifiers((currentSelection) =>
      currentSelection.includes(universalIdentifier)
        ? currentSelection.filter(
            (identifier) => identifier !== universalIdentifier,
          )
        : [...currentSelection, universalIdentifier],
    );
  };

  const handleAddClouds = async () => {
    const { failedClouds } = await installClouds(selectedUniversalIdentifiers);

    setJustInstalledUniversalIdentifiers((current) => [
      ...current,
      ...selectedUniversalIdentifiers.filter(
        (universalIdentifier) => !failedClouds.includes(universalIdentifier),
      ),
    ]);
    setSelectedUniversalIdentifiers([]);
  };

  return (
    <SettingsPageLayout
      title={t`Clouds`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: t`Clouds` },
      ]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`Industry Clouds`}
            description={t`Each Cloud adds the records, fields and pipelines an industry runs on. Clouds already set up are checked.`}
          />
          <PulseCloudTiles
            selectedUniversalIdentifiers={selectedUniversalIdentifiers}
            disabledUniversalIdentifiers={installedUniversalIdentifiers}
            onToggle={toggleCloud}
            disabled={isInstalling}
          />
        </Section.Root>
        <Section.Root>
          <Button
            startIcon={<IconPlus />}
            variant="solid"
            color="accent"
            disabled={
              !isNonEmptyArray(selectedUniversalIdentifiers) || isInstalling
            }
            onClick={handleAddClouds}
          >
            {isInstalling ? t`Setting up...` : t`Add selected Clouds`}
          </Button>
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
