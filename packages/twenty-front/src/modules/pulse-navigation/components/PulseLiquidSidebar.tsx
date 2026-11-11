import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
const StyledNavigation = styled.div`
  position: relative;
  [aria-current='page'] {
    background: var(--t-accent-quaternary) !important;
    border-color: var(--t-accent-accent5);
    box-shadow: inset 2px 0 0 var(--t-accent-accent9);
    color: var(--t-font-color-primary);
  }
`;
export const PulseLiquidSidebar = ({ children }: { children: ReactNode }) => (
  <StyledNavigation className="pulse-liquid">{children}</StyledNavigation>
);
