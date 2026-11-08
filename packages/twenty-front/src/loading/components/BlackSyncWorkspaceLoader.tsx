import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLoader = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  min-height: calc(100dvh / var(--t-zoom, 1));
  padding: 24px;
  text-align: center;
  width: 100%;
  img {
    height: 56px;
    width: 56px;
  }
  strong {
    font-size: 20px;
    letter-spacing: -0.5px;
  }
  p {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.5;
    margin: 0;
    max-width: 360px;
  }
  button {
    background: transparent;
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 8px;
    color: inherit;
    cursor: pointer;
    font: inherit;
    padding: 9px 16px;
  }
  button:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
  }
`;

export const BlackSyncWorkspaceLoader = () => {
  const { t } = useLingui();
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setIsTakingLonger(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <StyledLoader>
      <img src="/images/integrations/blacksync-pulse-logo.svg" alt="" />
      <strong>BlackSync Cloud</strong>
      <p role="status">
        {isTakingLonger
          ? t`This is taking longer than expected. Check your connection, or reload to try again.`
          : t`Opening your workspace…`}
      </p>
      {isTakingLonger && (
        <button
          type="button"
          onClick={() => window.location.reload()}
        >{t`Reload workspace`}</button>
      )}
    </StyledLoader>
  );
};
