import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

export const CLOUD_FOLDER_ID = '27e8df02-8597-5f92-8db6-3e4c6c41ca00';

export default defineNavigationMenuItem({
  universalIdentifier: CLOUD_FOLDER_ID,
  position: 10,
  type: NavigationMenuItemType.FOLDER,
  name: 'Mortgage & Lending',
  icon: 'IconBuildingBank',
  color: 'purple',
});
