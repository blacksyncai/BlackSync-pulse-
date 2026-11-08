import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

export const CrmGlassSurface = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.045);

  @supports (backdrop-filter: blur(12px)) {
    background: color-mix(
      in srgb,
      ${themeCssVariables.background.primary} 96%,
      transparent
    );
    backdrop-filter: blur(12px) saturate(1.08);
  }

  @media (prefers-reduced-transparency: reduce) {
    background: ${themeCssVariables.background.primary};
    backdrop-filter: none;
  }
`;
