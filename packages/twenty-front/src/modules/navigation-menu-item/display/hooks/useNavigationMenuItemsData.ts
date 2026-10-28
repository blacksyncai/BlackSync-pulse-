import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { isLayoutCustomizationModeEnabledState } from '@/layout-customization/states/isLayoutCustomizationModeEnabledState';
import { navigationMenuItemsDraftState } from '@/navigation-menu-item/common/states/navigationMenuItemsDraftState';
import { filterWorkspaceNavigationMenuItems } from '@/navigation-menu-item/common/utils/filterWorkspaceNavigationMenuItems';
import { navigationMenuItemsSelector } from '@/navigation-menu-item/common/states/navigationMenuItemsSelector';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

import { objectMetadataItemsByNameSingularMapSelector } from '@/object-metadata/states/objectMetadataItemsByNameSingularMapSelector';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { CoreObjectNameSingular, ViewType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type NavigationMenuItem } from '~/generated-metadata/graphql';

type NavigationMenuItemsData = {
  navigationMenuItems: NavigationMenuItem[];
  workspaceNavigationMenuItems: NavigationMenuItem[];
  currentWorkspaceMemberId: string | undefined;
  currentUserWorkspaceId: string | undefined;
};

export const useNavigationMenuItemsData = (): NavigationMenuItemsData => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const currentWorkspaceMemberId = currentWorkspaceMember?.id;
  const navigationMenuItems = useAtomStateValue(navigationMenuItemsSelector);
  const isLayoutCustomizationModeEnabled = useAtomStateValue(
    isLayoutCustomizationModeEnabledState,
  );
  const navigationMenuItemsDraft = useAtomStateValue(
    navigationMenuItemsDraftState,
  );

  const userNavigationMenuItems = navigationMenuItems.filter((item) =>
    isDefined(item.userWorkspaceId),
  );

  const views = useAtomStateValue(viewsSelector);
  const objectMetadataItemsByNameSingular = useAtomStateValue(
    objectMetadataItemsByNameSingularMapSelector,
  );
  const opportunityObjectMetadataId = objectMetadataItemsByNameSingular.get(
    CoreObjectNameSingular.Opportunity,
  )?.id;
  // Deal boards live on the Opportunities page behind a pipeline switcher, so their
  // individual sidebar shortcuts are hidden.
  const dealBoardViewIds = new Set(
    views
      .filter(
        (view) =>
          view.type === ViewType.KANBAN &&
          view.objectMetadataId === opportunityObjectMetadataId,
      )
      .map((view) => view.id),
  );

  const workspaceNavigationMenuItemsFromState =
    filterWorkspaceNavigationMenuItems(navigationMenuItems).filter(
      (item) => !isDefined(item.viewId) || !dealBoardViewIds.has(item.viewId),
    );

  const workspaceNavigationMenuItems =
    isLayoutCustomizationModeEnabled && isDefined(navigationMenuItemsDraft)
      ? navigationMenuItemsDraft
      : workspaceNavigationMenuItemsFromState;

  return {
    navigationMenuItems: userNavigationMenuItems,
    workspaceNavigationMenuItems,
    currentWorkspaceMemberId,
    currentUserWorkspaceId:
      currentWorkspaceMember?.userWorkspaceId ?? undefined,
  };
};
