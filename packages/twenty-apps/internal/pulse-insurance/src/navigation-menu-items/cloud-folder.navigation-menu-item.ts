import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

export const CLOUD_FOLDER_ID = '6b7377ad-7208-5e85-a84d-672ee59a6e3a';

export default defineNavigationMenuItem({
  universalIdentifier: CLOUD_FOLDER_ID,
  position: 10,
  type: NavigationMenuItemType.FOLDER,
  name: 'Insurance',
  icon: 'IconShieldCheck',
  color: 'purple',
});
