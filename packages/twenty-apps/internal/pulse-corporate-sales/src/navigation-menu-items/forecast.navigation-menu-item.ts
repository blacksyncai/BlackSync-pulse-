import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { FORECAST_VIEW_ID } from '../views/forecast.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'c06b88fb-b82c-5218-8c77-e915aa7ef2ef',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: FORECAST_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
