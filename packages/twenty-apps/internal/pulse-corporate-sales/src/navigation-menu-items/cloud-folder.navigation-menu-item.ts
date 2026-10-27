import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

export const CLOUD_FOLDER_ID = '055b60ee-1fac-5ea3-8c94-53fc04156a3d';

export default defineNavigationMenuItem({
  universalIdentifier: CLOUD_FOLDER_ID,
  position: 10,
  type: NavigationMenuItemType.FOLDER,
  name: 'Corporate Sales',
  icon: 'IconBriefcase',
  color: 'purple',
});
