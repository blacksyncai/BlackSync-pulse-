import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type PulseCallStatus =
  | 'idle'
  | 'connecting'
  | 'ringing'
  | 'in-call'
  | 'ended'
  | 'failed';

export type PulseCall = {
  status: PulseCallStatus;
  phoneNumber: string | null;
  answeredAt: number | null;
  isMuted: boolean;
  errorMessage: string | null;
};

export const PULSE_CALL_IDLE: PulseCall = {
  status: 'idle',
  phoneNumber: null,
  answeredAt: null,
  isMuted: false,
  errorMessage: null,
};

export const pulseCallState = createAtomState<PulseCall>({
  key: 'pulseCallState',
  defaultValue: PULSE_CALL_IDLE,
});
