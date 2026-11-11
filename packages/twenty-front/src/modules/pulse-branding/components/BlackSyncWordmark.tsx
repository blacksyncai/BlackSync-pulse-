import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
const StyledBrand = styled(Link)`
  align-items: center;
  display: flex;
  gap: 10px;
  color: var(--t-font-color-primary);
  text-decoration: none;
  padding: 22px 16px 16px;
  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  strong {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.16em;
  }
  span {
    font-size: 9px;
    font-weight: 650;
    letter-spacing: 0.15em;
    color: var(--t-font-color-secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--t-accent-accent9);
    outline-offset: -4px;
    border-radius: 12px;
  }
`;
export const BlackSyncWordmark = () => {
  const { t } = useLingui();
  return (
    <StyledBrand to="/dashboard" aria-label={t`BlackSync Cloud dashboard`}>
      <div>
        <strong>BLACKSYNC</strong>
        <span>CLOUD WORKSPACE</span>
      </div>
    </StyledBrand>
  );
};
