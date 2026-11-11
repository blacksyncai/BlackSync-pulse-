import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
const StyledBrand = styled(Link)`
  align-items: center;
  display: flex;
  gap: 10px;
  color: #effbf5;
  text-decoration: none;
  padding: 22px 16px 16px;
  svg {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    color: #66e3bf;
    background: #66e3bf12;
    padding: 5px;
    box-sizing: border-box;
    border: 1px solid #66e3bf30;
    border-radius: 9px;
  }
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
    color: #9bbeb3;
  }
  &:focus-visible {
    outline: 2px solid #66e3bf;
    outline-offset: -4px;
    border-radius: 12px;
  }
`;
export const BlackSyncWordmark = () => {
  const { t } = useLingui();
  return (
    <StyledBrand to="/dashboard" aria-label={t`BlackSync Cloud dashboard`}>
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <path
          d="M8 52H29L39 30L50 73L61 20L70 52H88"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <strong>BLACKSYNC</strong>
        <span>CLOUD WORKSPACE</span>
      </div>
    </StyledBrand>
  );
};
