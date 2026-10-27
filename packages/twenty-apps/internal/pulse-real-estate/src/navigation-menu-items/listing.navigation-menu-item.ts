import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { LISTING_OBJECT_ID } from '../objects/listing.object';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '6fb97371-341d-54b0-a18a-44331f8f4ec1',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: LISTING_OBJECT_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
