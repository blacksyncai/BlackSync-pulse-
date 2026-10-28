import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type PulseCallSettings = {
  callerId: string | null;
  // Recording stays off unless the caller turns it on.
  autoRecord: boolean;
  speakerDeviceId: string | null;
  ringtoneDeviceId: string | null;
  microphoneDeviceId: string | null;
};

export const PULSE_CALL_SETTINGS_DEFAULT: PulseCallSettings = {
  callerId: null,
  autoRecord: false,
  speakerDeviceId: null,
  ringtoneDeviceId: null,
  microphoneDeviceId: null,
};

export const pulseCallSettingsState = createAtomState<PulseCallSettings>({
  key: 'pulseCallSettings',
  defaultValue: PULSE_CALL_SETTINGS_DEFAULT,
  useLocalStorage: true,
});
