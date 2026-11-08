import { isRecordSidePanelOverlayState } from '@/side-panel/states/isRecordSidePanelOverlayState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLayoutEffect } from 'react';

export const PulseWideSidePanelEffect = () => {
  const setIsRecordOverlay = useSetAtomState(isRecordSidePanelOverlayState);
  // Record detail needs room without changing the board's layout or saved drawer width.
  useLayoutEffect(() => {
    setIsRecordOverlay(true);
    return () => setIsRecordOverlay(false);
  }, [setIsRecordOverlay]);
  return null;
};
