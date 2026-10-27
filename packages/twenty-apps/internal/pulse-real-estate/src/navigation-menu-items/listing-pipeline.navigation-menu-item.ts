import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { LISTING_PIPELINE_VIEW_ID } from '../views/listing-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '7cd646e5-ff71-589f-8062-8bd26a84466d',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: LISTING_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
