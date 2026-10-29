import { styled } from '@linaria/react';
import { useState } from 'react';
import { getLogoUrlFromDomainName, isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLogo = styled.span`
  align-items: center;
  background: ${themeCssVariables.accent.quaternary};
  border-radius: 8px;
  color: ${themeCssVariables.accent.accent11};
  display: flex;
  flex: none;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: 700;
  height: 28px;
  justify-content: center;
  overflow: hidden;
  width: 28px;

  img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
`;

type PulseLeadLogoProps = {
  name: string | null;
  domain: string | null;
};

export const PulseLeadLogo = ({ name, domain }: PulseLeadLogoProps) => {
  const [hasFailed, setHasFailed] = useState(false);
  const logoUrl = getLogoUrlFromDomainName(domain ?? '');

  return (
    <StyledLogo>
      {isDefined(logoUrl) && !hasFailed ? (
        <img src={logoUrl} alt="" onError={() => setHasFailed(true)} />
      ) : (
        (name ?? '?').charAt(0).toUpperCase()
      )}
    </StyledLogo>
  );
};
