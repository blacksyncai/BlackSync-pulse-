import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';
import { LOAN_PIPELINE_VIEW_ID } from '../views/loan-pipeline.view';
import { CLOUD_FOLDER_ID } from './cloud-folder.navigation-menu-item';

export default defineNavigationMenuItem({
  universalIdentifier: '29eb588f-91d0-5931-ac22-12ceb2dbb595',
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: LOAN_PIPELINE_VIEW_ID,
  folderUniversalIdentifier: CLOUD_FOLDER_ID,
});
