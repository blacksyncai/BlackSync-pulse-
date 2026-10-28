import {
  SIDE_PANEL_WIDTH_VAR,
  sidePanelWidthState,
} from '@/side-panel/states/sidePanelWidthState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useEffect } from 'react';

// Accounts open in a wide panel so the Close-style two-column view fits beside the list.
const WIDE_SIDE_PANEL_WIDTH = '75vw';

export const PulseWideSidePanelEffect = () => {
  const sidePanelWidth = useAtomStateValue(sidePanelWidthState);

  useEffect(() => {
    document.documentElement.style.setProperty(
      SIDE_PANEL_WIDTH_VAR,
      WIDE_SIDE_PANEL_WIDTH,
    );

    return () => {
      document.documentElement.style.setProperty(
        SIDE_PANEL_WIDTH_VAR,
        `${sidePanelWidth}px`,
      );
    };
  }, [sidePanelWidth]);

  return null;
};
