import { OnboardingRewardMainButton } from '@/onboarding/components/OnboardingRewardMainButton';
import { OnboardingSkipButton } from '@/onboarding/components/OnboardingSkipButton';
import { OnboardingStepAnimatedItem } from '@/onboarding/components/OnboardingStepAnimatedItem';
import { StyledOnboardingStepHeading } from '@/onboarding/components/StyledOnboardingStepHeading';
import { StyledOnboardingStepPage } from '@/onboarding/components/StyledOnboardingStepPage';
import { StyledOnboardingStepSubtitle } from '@/onboarding/components/StyledOnboardingStepSubtitle';
import { StyledOnboardingStepTitle } from '@/onboarding/components/StyledOnboardingStepTitle';
import { useTriggerInstallAppsOnboardingStep } from '@/onboarding/hooks/useTriggerInstallAppsOnboardingStep';
import { PulseCloudTiles } from '@/pulse-clouds/components/PulseCloudTiles';
import { useInstallPulseClouds } from '@/pulse-clouds/hooks/useInstallPulseClouds';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isNonEmptyArray } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledFooter = styled.div`
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  max-width: 100%;
  width: 560px;
`;

const StyledMainButton = styled.div`
  width: 100%;
`;

export const ChooseYourCloud = () => {
  const { t } = useLingui();
  const [selectedUniversalIdentifiers, setSelectedUniversalIdentifiers] =
    useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const { installClouds, isInstalling } = useInstallPulseClouds();
  const triggerInstallAppsOnboardingStep =
    useTriggerInstallAppsOnboardingStep();

  const toggleCloud = (universalIdentifier: string) => {
    setSelectedUniversalIdentifiers((currentSelection) =>
      currentSelection.includes(universalIdentifier)
        ? currentSelection.filter(
            (identifier) => identifier !== universalIdentifier,
          )
        : [...currentSelection, universalIdentifier],
    );
  };

  const completeStep = async (universalIdentifiers: string[]) => {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);

    if (isNonEmptyArray(universalIdentifiers)) {
      await installClouds(universalIdentifiers);
    }

    try {
      await triggerInstallAppsOnboardingStep({
        universalIdentifiers: [],
        isAutoSkipped: false,
      });
    } catch {
      setIsCompleting(false);
    }
  };

  const hasSelection = isNonEmptyArray(selectedUniversalIdentifiers);

  return (
    <StyledOnboardingStepPage data-testid="onboarding-choose-cloud-step">
      <StyledOnboardingStepHeading>
        <OnboardingStepAnimatedItem index={0}>
          <StyledOnboardingStepTitle>{t`Choose your Cloud`}</StyledOnboardingStepTitle>
        </OnboardingStepAnimatedItem>
        <OnboardingStepAnimatedItem index={1}>
          <StyledOnboardingStepSubtitle>
            {t`BlackSync Cloud sets up the records and pipelines your industry runs on. Pick one or more.`}
          </StyledOnboardingStepSubtitle>
        </OnboardingStepAnimatedItem>
      </StyledOnboardingStepHeading>

      <OnboardingStepAnimatedItem index={2}>
        <PulseCloudTiles
          selectedUniversalIdentifiers={selectedUniversalIdentifiers}
          onToggle={toggleCloud}
          disabled={isCompleting}
        />
      </OnboardingStepAnimatedItem>

      <OnboardingStepAnimatedItem index={3}>
        <StyledFooter>
          <StyledMainButton>
            <OnboardingRewardMainButton
              label={
                isInstalling
                  ? t`Setting up your CRM...`
                  : hasSelection
                    ? t`Set up my CRM`
                    : t`Continue without a Cloud`
              }
              creditsReward={0}
              disabled={isCompleting}
              onClick={() => completeStep(selectedUniversalIdentifiers)}
            />
          </StyledMainButton>
          <OnboardingSkipButton
            onClick={() => completeStep([])}
            disabled={isCompleting}
          />
        </StyledFooter>
      </OnboardingStepAnimatedItem>
    </StyledOnboardingStepPage>
  );
};
