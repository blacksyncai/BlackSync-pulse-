import { GRAY_COLOR_TOKENS } from './color/gray';
import { MAUVE_COLOR_TOKENS } from './color/mauve';

const mauve = MAUVE_COLOR_TOKENS.scale;

// BlackSync Pulse neutrals carry a slight violet tint to sit with the violet accent.
export const GRAY_SCALE_TOKENS: typeof GRAY_COLOR_TOKENS.scale = {
  gray1: mauve.mauve1,
  gray2: mauve.mauve2,
  gray3: mauve.mauve3,
  gray4: mauve.mauve4,
  gray5: mauve.mauve5,
  gray6: mauve.mauve6,
  gray7: mauve.mauve7,
  gray8: mauve.mauve8,
  gray9: mauve.mauve9,
  gray10: mauve.mauve10,
  gray11: mauve.mauve11,
  gray12: mauve.mauve12,
};
