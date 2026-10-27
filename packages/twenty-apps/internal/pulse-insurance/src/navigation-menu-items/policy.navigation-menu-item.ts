import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { POLICY_OBJECT_ID } from '../objects/policy.object';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: 'cb4061ae-ae23-5b62-bb52-3b7b0fcb2d03',
  position: 0,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: POLICY_OBJECT_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
