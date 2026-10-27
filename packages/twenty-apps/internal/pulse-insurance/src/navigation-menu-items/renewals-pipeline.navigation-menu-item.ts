import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { RENEWALS_PIPELINE_VIEW_ID } from '../views/renewals-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'bfe3eebd-a59a-5dd6-a1b0-8304d70d1daf',
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: RENEWALS_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
