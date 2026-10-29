import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';
import { PulseLiquidSidebar } from '@/pulse-navigation/components/PulseLiquidSidebar';
import { PulseNavigationSection } from '@/pulse-navigation/components/PulseNavigationSection';
import { NavigationDrawerSectionTitle } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSectionTitle';

import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { lazy, Suspense, useState } from 'react';

import { themeCssVariables } from 'twenty-ui/theme';

const MORE_OPEN_STORAGE_KEY = 'pulse-nav-more-open';

const FavoritesSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher').then(
    (module) => ({
      default: module.FavoritesSectionDispatcher,
    }),
  ),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher').then(
    (module) => ({
      default: module.WorkspaceSectionDispatcher,
    }),
  ),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

const readMoreOpen = () => {
  try {
    return localStorage.getItem(MORE_OPEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const MainNavigationDrawerScrollableItems = () => {
  const { t } = useLingui();
  const [isMoreOpen, setIsMoreOpen] = useState(readMoreOpen);

  const toggleMore = () => {
    const next = !isMoreOpen;

    setIsMoreOpen(next);

    try {
      localStorage.setItem(MORE_OPEN_STORAGE_KEY, String(next));
    } catch {
      // Remembering the toggle is a convenience only.
    }
  };

  return (
    <PulseLiquidSidebar>
      <StyledScrollableItemsContainer>
        <PulseNavigationSection />
        <div>
          <NavigationDrawerSectionTitle
            label={t`More`}
            isOpen={isMoreOpen}
            onClick={toggleMore}
          />
          {isMoreOpen && (
            <StyledScrollableItemsContainer>
              <NavigationDrawerOpenedSection />
              <Suspense
                fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}
              >
                <FavoritesSectionDispatcher />
                <WorkspaceSectionDispatcher />
              </Suspense>
            </StyledScrollableItemsContainer>
          )}
        </div>
      </StyledScrollableItemsContainer>
    </PulseLiquidSidebar>
  );
};
