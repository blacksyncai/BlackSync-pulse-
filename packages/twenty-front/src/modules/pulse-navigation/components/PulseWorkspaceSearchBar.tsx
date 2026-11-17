import { useOpenRecordsSearchPageInSidePanel } from '@/side-panel/hooks/useOpenRecordsSearchPageInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconSearch } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledBar = styled.div`
  background: ${themeCssVariables.background.primary};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  padding: 12px 24px;
  flex-shrink: 0;
  button {
    align-items: center;
    display: flex;
    gap: 10px;
    background: ${themeCssVariables.background.secondary};
    border: 1px solid transparent;
    border-radius: 9px;
    color: ${themeCssVariables.font.color.secondary};
    cursor: pointer;
    font: inherit;
    font-size: 14px;
    padding: 11px 14px;
    width: min(640px, 100%);
    text-align: left;
  }
  button:hover {
    border-color: ${themeCssVariables.border.color.medium};
  }
  button:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 2px;
  }
  @media (max-width: 600px) {
    padding: 9px 12px;
  }
  @media print {
    display: none;
  }
`;
export const PulseWorkspaceSearchBar = () => {
  const { t } = useLingui();
  const { openRecordsSearchPage } = useOpenRecordsSearchPageInSidePanel();
  return (
    <StyledBar>
      <button type="button" onClick={openRecordsSearchPage}>
        <IconSearch size={18} />
        <span>{t`Search contacts, companies, and records…`}</span>
      </button>
    </StyledBar>
  );
};
