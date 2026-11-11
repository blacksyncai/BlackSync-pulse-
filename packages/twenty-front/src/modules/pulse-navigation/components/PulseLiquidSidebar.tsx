import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
const StyledNavigation = styled.div`
  position: relative;
  [aria-current='page'] {
    background: linear-gradient(100deg, #66e3bf22, #66e3bf0a) !important;
    border-color: #66e3bf26;
    box-shadow: inset 2px 0 0 #66e3bf;
    color: #effbf5;
  }
`;
export const PulseLiquidSidebar = ({ children }: { children: ReactNode }) => (
  <StyledNavigation className="pulse-liquid">{children}</StyledNavigation>
);
