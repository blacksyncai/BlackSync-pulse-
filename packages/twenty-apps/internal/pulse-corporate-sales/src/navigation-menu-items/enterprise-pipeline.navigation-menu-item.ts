import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { ENTERPRISE_PIPELINE_VIEW_ID } from '../views/enterprise-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '6cbcc58c-b08c-5f91-99cf-9a563e8e28d4',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: ENTERPRISE_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
