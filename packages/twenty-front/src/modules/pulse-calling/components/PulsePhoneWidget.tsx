import { PLIVO_VOICE_ACCESS } from '@/pulse-calling/graphql/queries/plivoVoiceAccess';
import {
  type PlivoVoiceAccessResult,
  PulseCallingUnavailableError,
  usePulseCalling,
} from '@/pulse-calling/hooks/usePulseCalling';
import { pulseCallSettingsState } from '@/pulse-calling/states/pulseCallSettingsState';
import { pulseCallState } from '@/pulse-calling/states/pulseCallState';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { IconChevronDown, IconPhone } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const PANEL_WIDTH = 360;

const StyledTrigger = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  gap: 2px;
  height: 24px;
  padding: 0 4px;
  position: relative;

  &:hover,
  &[aria-expanded='true'] {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }

  &[data-live='true']::after {
    background: #30a46c;
    border-radius: 50%;
    content: '';
    height: 7px;
    position: absolute;
    right: 2px;
    top: 2px;
    width: 7px;
  }
`;

const StyledBackdrop = styled.div`
  inset: 0;
  position: fixed;
  z-index: 40;
`;

const StyledPanel = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: fixed;
  width: ${PANEL_WIDTH}px;
  z-index: 41;
`;

const StyledSection = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledEyebrow = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  min-width: 0;
  padding: 8px 10px;
  width: 100%;
`;

const StyledRow = styled.label`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
`;

const StyledDeviceRow = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 90px 1fr;
`;

const StyledSwitch = styled.input`
  accent-color: ${themeCssVariables.accent.accent9};
  cursor: pointer;
  height: 20px;
  width: 36px;
`;

const StyledLinkButton = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.accent.accent10};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 0;
`;

const StyledMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDialForm = styled.form`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledDialInput = styled.input`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.accent.accent8};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.lg};
  min-width: 0;
  outline: none;
  padding: 10px 12px;
`;

const StyledDialButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.accent.accent9};
  border: 0;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: center;
  width: 48px;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

type AudioDevices = {
  outputs: MediaDeviceInfo[];
  inputs: MediaDeviceInfo[];
};

export const PulsePhoneWidget = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { startCall } = usePulseCalling();
  const call = useAtomStateValue(pulseCallState);
  const [settings, setSettings] = useAtomState(pulseCallSettingsState);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [devices, setDevices] = useState<AudioDevices>({
    outputs: [],
    inputs: [],
  });
  const [number, setNumber] = useState('');

  const isOpen = isDefined(panelPosition);
  const { data } = useQuery<PlivoVoiceAccessResult>(PLIVO_VOICE_ACCESS, {
    skip: !isOpen,
    fetchPolicy: 'cache-first',
  });
  const access = data?.plivoVoiceAccess;
  const callerIds = access?.callerIds ?? [];
  const selectedCallerId = settings.callerId ?? access?.defaultCallerId ?? '';
  const isLive = ['connecting', 'ringing', 'in-call'].includes(call.status);

  const loadDevices = async () => {
    const all = await navigator.mediaDevices?.enumerateDevices?.();

    setDevices({
      outputs: (all ?? []).filter((device) => device.kind === 'audiooutput'),
      inputs: (all ?? []).filter((device) => device.kind === 'audioinput'),
    });
  };

  const handleToggle = () => {
    if (isOpen) {
      setPanelPosition(null);

      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();

    setPanelPosition({
      top: (rect?.bottom ?? 40) + 8,
      left: Math.min(rect?.left ?? 16, window.innerWidth - PANEL_WIDTH - 16),
    });
    void loadDevices();
  };

  // Device names stay hidden until the browser has granted microphone access once.
  const handleAllowMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    stream.getTracks().forEach((track) => track.stop());
    await loadDevices();
  };

  const handleDial = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const phoneNumber = number.trim();

    if (phoneNumber.length === 0) {
      return;
    }

    try {
      await startCall(phoneNumber);
      setNumber('');
      setPanelPosition(null);
    } catch (error) {
      if (error instanceof PulseCallingUnavailableError) {
        window.location.href = `tel:${phoneNumber}`;

        return;
      }

      enqueueToast({
        variant: 'error',
        children:
          error instanceof Error && error.message.length > 0
            ? t`Could not start the call: ${error.message}`
            : t`Could not start the call. Check your microphone and Plivo settings.`,
      });
    }
  };

  const hasDeviceLabels = devices.inputs.some(
    (device) => device.label.length > 0,
  );

  const renderDeviceOptions = (list: MediaDeviceInfo[]) => (
    <>
      <option value="">{t`System default`}</option>
      {list
        .filter((device) => device.deviceId !== 'default')
        .map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || t`Device`}
          </option>
        ))}
    </>
  );

  return (
    <>
      <StyledTrigger
        ref={triggerRef}
        type="button"
        aria-label={t`Phone`}
        aria-expanded={isOpen}
        data-live={isLive}
        onClick={handleToggle}
      >
        <IconPhone size={16} />
        <IconChevronDown size={12} />
      </StyledTrigger>
      {isOpen && (
        <>
          <StyledBackdrop onClick={() => setPanelPosition(null)} />
          <StyledPanel style={panelPosition}>
            <StyledSection>
              <StyledEyebrow>{t`Phone settings`}</StyledEyebrow>
              <StyledLabel>{t`Caller ID`}</StyledLabel>
              {callerIds.length > 0 ? (
                <StyledSelect
                  value={selectedCallerId}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      callerId: event.target.value || null,
                    }))
                  }
                >
                  {callerIds.map((callerId) => (
                    <option key={callerId.number} value={callerId.number}>
                      {callerId.number}
                      {isDefined(callerId.label) ? ` · ${callerId.label}` : ''}
                    </option>
                  ))}
                </StyledSelect>
              ) : (
                <StyledMuted>
                  {access?.isEnabled === false
                    ? t`Calling is not set up yet.`
                    : t`Loading your numbers...`}
                </StyledMuted>
              )}
            </StyledSection>

            <StyledSection>
              <StyledRow>
                <StyledLabel>{t`Auto-record calls`}</StyledLabel>
                <StyledSwitch
                  type="checkbox"
                  checked={settings.autoRecord}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      autoRecord: event.target.checked,
                    }))
                  }
                />
              </StyledRow>
            </StyledSection>

            <StyledSection>
              <StyledLabel>{t`Audio settings`}</StyledLabel>
              <StyledDeviceRow>
                {t`Output`}
                <StyledSelect
                  value={settings.speakerDeviceId ?? ''}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      speakerDeviceId: event.target.value || null,
                    }))
                  }
                >
                  {renderDeviceOptions(devices.outputs)}
                </StyledSelect>
              </StyledDeviceRow>
              <StyledDeviceRow>
                {t`Ringing`}
                <StyledSelect
                  value={settings.ringtoneDeviceId ?? ''}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      ringtoneDeviceId: event.target.value || null,
                    }))
                  }
                >
                  {renderDeviceOptions(devices.outputs)}
                </StyledSelect>
              </StyledDeviceRow>
              <StyledDeviceRow>
                {t`Microphone`}
                <StyledSelect
                  value={settings.microphoneDeviceId ?? ''}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      microphoneDeviceId: event.target.value || null,
                    }))
                  }
                >
                  {renderDeviceOptions(devices.inputs)}
                </StyledSelect>
              </StyledDeviceRow>
              {!hasDeviceLabels && (
                <StyledLinkButton type="button" onClick={handleAllowMicrophone}>
                  {t`Allow microphone to pick devices`}
                </StyledLinkButton>
              )}
            </StyledSection>

            <StyledDialForm onSubmit={handleDial}>
              <StyledDialInput
                autoFocus
                type="tel"
                value={number}
                placeholder={t`Dial a number...`}
                onChange={(event) => setNumber(event.target.value)}
              />
              <StyledDialButton
                type="submit"
                aria-label={t`Call`}
                disabled={number.trim().length === 0 || isLive}
              >
                <IconPhone size={18} />
              </StyledDialButton>
            </StyledDialForm>
          </StyledPanel>
        </>
      )}
    </>
  );
};
