import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { RENEWALS_PIPELINE_VIEW_ID } from '../views/renewals-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '92b83f56-8a49-5768-a559-2650eb06eff1',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: RENEWALS_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
