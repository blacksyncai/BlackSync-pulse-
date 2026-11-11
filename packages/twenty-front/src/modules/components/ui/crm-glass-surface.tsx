import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

export const CrmGlassSurface = styled.div`
  background: var(--bs-glass, ${themeCssVariables.background.primary});
  border: 1px solid var(--bs-edge, ${themeCssVariables.border.color.medium});
  border-radius: 24px;
  box-shadow: var(--bs-shadow, 0 16px 48px -32px #123a3140);
  @supports (backdrop-filter: blur(16px)) {
    backdrop-filter: blur(16px) saturate(1.12);
  }
  @media (prefers-reduced-transparency: reduce) {
    backdrop-filter: none;
    background: ${themeCssVariables.background.primary};
  }
`;
