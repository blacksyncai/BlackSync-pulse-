import { useDirectFileUpload } from '@/file/hooks/useDirectFileUpload';
import { useInvalidateMetadataStore } from '@/metadata-store/hooks/useInvalidateMetadataStore';
import { PULSE_CLOUDS } from '@/pulse-clouds/constants/PulseClouds';
import { COMPLETE_APP_TARBALL_UPLOAD } from '@/pulse-clouds/graphql/mutations/completeAppTarballUpload';
import { useMutation } from '@apollo/client/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import {
  FileFolder,
  InstallApplicationDocument,
} from '~/generated-metadata/graphql';

type CompleteAppTarballUploadResult = {
  completeAppTarballUpload: { id: string; universalIdentifier: string };
};

type CompleteAppTarballUploadVariables = {
  fileId: string;
};

export const useInstallPulseClouds = () => {
  const { enqueueToast } = useToast();
  const { createFileUploadAndPutFile } = useDirectFileUpload();
  const { invalidateMetadataStore } = useInvalidateMetadataStore();
  const [completeAppTarballUpload] = useMutation<
    CompleteAppTarballUploadResult,
    CompleteAppTarballUploadVariables
  >(COMPLETE_APP_TARBALL_UPLOAD);
  const [installApplication] = useMutation(InstallApplicationDocument);
  const [isInstalling, setIsInstalling] = useState(false);

  const installCloud = async (universalIdentifier: string) => {
    const cloud = PULSE_CLOUDS.find(
      (pulseCloud) => pulseCloud.universalIdentifier === universalIdentifier,
    );

    if (!isDefined(cloud)) {
      return;
    }

    const response = await fetch(cloud.tarballPath);

    if (!response.ok) {
      throw new Error(`Could not load ${cloud.tarballPath}`);
    }

    const tarball = new File(
      [await response.blob()],
      cloud.tarballPath.split('/').pop() ?? 'cloud.tgz',
      { type: 'application/gzip' },
    );

    const { fileId } = await createFileUploadAndPutFile(tarball, {
      fileFolder: FileFolder.AppTarball,
    });

    // Registering an already-registered Cloud fails; installing it still works.
    await completeAppTarballUpload({ variables: { fileId } }).catch(
      () => undefined,
    );

    await installApplication({ variables: { universalIdentifier } });
  };

  const installClouds = async (universalIdentifiers: string[]) => {
    setIsInstalling(true);

    const failedClouds: string[] = [];

    for (const universalIdentifier of universalIdentifiers) {
      try {
        await installCloud(universalIdentifier);
      } catch {
        failedClouds.push(universalIdentifier);
      }
    }

    invalidateMetadataStore();
    setIsInstalling(false);

    if (failedClouds.length > 0) {
      enqueueToast({
        variant: 'error',
        children: t`Some Clouds could not be set up. You can add them later in Settings.`,
      });
    }

    return { failedClouds };
  };

  return { installClouds, isInstalling };
};
