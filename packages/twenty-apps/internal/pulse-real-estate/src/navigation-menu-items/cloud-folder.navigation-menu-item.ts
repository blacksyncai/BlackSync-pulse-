import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

export const CLOUD_FOLDER_ID = '5a46dfd8-21b6-5ae6-bef6-0052537ce994';

export default defineNavigationMenuItem({
  universalIdentifier: CLOUD_FOLDER_ID,
  position: 10,
  type: NavigationMenuItemType.FOLDER,
  name: 'Real Estate',
  icon: 'IconHome',
  color: 'purple',
});
