import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';
import { PulseLiquidSidebar } from '@/pulse-navigation/components/PulseLiquidSidebar';
import { PulseNavigationSection } from '@/pulse-navigation/components/PulseNavigationSection';

import { styled } from '@linaria/react';
import { lazy, Suspense } from 'react';

import { themeCssVariables } from 'twenty-ui/theme';

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

export const MainNavigationDrawerScrollableItems = () => {
  return (
    <PulseLiquidSidebar>
      <StyledScrollableItemsContainer>
        <PulseNavigationSection />
        <NavigationDrawerOpenedSection />
        <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
          <FavoritesSectionDispatcher />
          <WorkspaceSectionDispatcher />
        </Suspense>
      </StyledScrollableItemsContainer>
    </PulseLiquidSidebar>
  );
};
