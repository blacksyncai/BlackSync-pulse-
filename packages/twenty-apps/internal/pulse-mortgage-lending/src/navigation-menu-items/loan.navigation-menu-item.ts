import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { LOAN_OBJECT_ID } from '../objects/loan.object';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '3eb49782-9ef9-5287-bce6-3fc3b1b12c93',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: LOAN_OBJECT_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
