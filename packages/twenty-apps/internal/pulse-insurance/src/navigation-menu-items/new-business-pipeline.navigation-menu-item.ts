import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { NEW_BUSINESS_PIPELINE_VIEW_ID } from '../views/new-business-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '93168cd3-d82f-543d-9311-f4cd7b889590',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: NEW_BUSINESS_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
