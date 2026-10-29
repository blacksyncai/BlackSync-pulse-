import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme';

export const StyledSplit = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 260px 1fr;
  min-height: 0;
`;

export const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StyledListItem = styled.button`
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: 2px;
  padding: 10px 12px;
  text-align: left;

  small {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.sm};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

export const StyledCard = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[4]};

  input,
  select,
  textarea {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    padding: 8px 10px;
  }

  textarea {
    line-height: 1.5;
    min-height: 220px;
    resize: vertical;
  }

  label {
    color: ${themeCssVariables.font.color.secondary};
    display: flex;
    flex-direction: column;
    font-size: ${themeCssVariables.font.size.sm};
    gap: 4px;
  }
`;

export const StyledRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

export const StyledButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 4px;
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[data-primary='true'] {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
    color: #fff;
  }

  &[data-tone='danger'] {
    color: ${themeCssVariables.font.color.danger};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

export const StyledChip = styled.button`
  background: ${themeCssVariables.accent.quaternary};
  border: 0;
  border-radius: 999px;
  color: ${themeCssVariables.accent.accent11};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 3px 10px;
`;

export const StyledPreview = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.5;
  padding: ${themeCssVariables.spacing[3]};
  white-space: pre-wrap;

  strong {
    display: block;
    margin-bottom: ${themeCssVariables.spacing[2]};
  }
`;

export const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

export const StyledBanner = styled.div`
  background: ${themeCssVariables.background.transparent.danger};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.danger};
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[3]};
`;
