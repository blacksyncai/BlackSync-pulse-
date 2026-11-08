import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isRecordSidePanelOverlayState = createAtomState<boolean>({
  key: 'isRecordSidePanelOverlay',
  defaultValue: false,
});
