import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { BUYER_PIPELINE_VIEW_ID } from '../views/buyer-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '6eab9dfe-53e1-588b-9225-61a5698104b7',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: BUYER_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
