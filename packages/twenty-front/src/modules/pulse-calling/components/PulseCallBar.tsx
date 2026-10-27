import { usePulseCalling } from '@/pulse-calling/hooks/usePulseCalling';
import { pulseCallState } from '@/pulse-calling/states/pulseCallState';
import { formatCallDuration } from '@/pulse-calling/utils/formatCallDuration';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPhone,
  IconPhoneOff,
  IconX,
} from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

const StyledBar = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.accent.accent7};
  border-radius: ${themeCssVariables.border.radius.pill};
  bottom: ${themeCssVariables.spacing[6]};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  left: 50%;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[2]}
    ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  position: fixed;
  transform: translateX(-50%);
  z-index: 1000;
`;

const StyledPulse = styled.span`
  align-items: center;
  background: ${themeCssVariables.accent.tertiary};
  border-radius: 50%;
  color: ${themeCssVariables.accent.accent11};
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const StyledText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 140px;
`;

const StyledNumber = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledStatus = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const PulseCallBar = () => {
  const { t } = useLingui();
  const theme = useTheme();
  const call = useAtomStateValue(pulseCallState);
  const { hangUp, toggleMute, dismiss } = usePulseCalling();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (call.status !== 'in-call') {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [call.status]);

  if (call.status === 'idle') {
    return null;
  }

  const isLive = ['connecting', 'ringing', 'in-call'].includes(call.status);

  const statusLabel = (() => {
    switch (call.status) {
      case 'connecting':
        return t`Connecting...`;
      case 'ringing':
        return t`Ringing...`;
      case 'in-call':
        return isDefined(call.answeredAt)
          ? formatCallDuration(now - call.answeredAt)
          : t`On call`;
      case 'ended':
        return t`Call ended`;
      case 'failed':
        return call.errorMessage ?? t`Call failed`;
      default:
        return '';
    }
  })();

  return (
    <StyledBar role="status" aria-live="polite">
      <StyledPulse>
        <IconPhone size={theme.icon.size.md} />
      </StyledPulse>
      <StyledText>
        <StyledNumber>{call.phoneNumber}</StyledNumber>
        <StyledStatus>{statusLabel}</StyledStatus>
      </StyledText>
      {isLive ? (
        <>
          <Button
            variant="soft"
            size="sm"
            aria-label={call.isMuted ? t`Unmute` : t`Mute`}
            startIcon={
              call.isMuted ? (
                <IconMicrophoneOff size={theme.icon.size.md} />
              ) : (
                <IconMicrophone size={theme.icon.size.md} />
              )
            }
            disabled={call.status !== 'in-call'}
            onClick={toggleMute}
          />
          <Button
            variant="solid"
            color="danger"
            size="sm"
            startIcon={<IconPhoneOff size={theme.icon.size.md} />}
            onClick={hangUp}
          >{t`Hang up`}</Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          aria-label={t`Close`}
          startIcon={<IconX size={theme.icon.size.md} />}
          onClick={dismiss}
        />
      )}
    </StyledBar>
  );
};
