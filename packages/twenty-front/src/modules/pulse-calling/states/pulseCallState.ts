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
  endedAt: number | null;
  isMuted: boolean;
  errorMessage: string | null;
  personId: string | null;
  companyId: string | null;
  callUuid: string | null;
  isRecorded: boolean;
  isLogged: boolean;
  loggedNoteId: string | null;
};

export const PULSE_CALL_IDLE: PulseCall = {
  status: 'idle',
  phoneNumber: null,
  answeredAt: null,
  endedAt: null,
  isMuted: false,
  errorMessage: null,
  personId: null,
  companyId: null,
  callUuid: null,
  isRecorded: false,
  isLogged: false,
  loggedNoteId: null,
};

export const pulseCallState = createAtomState<PulseCall>({
  key: 'pulseCallState',
  defaultValue: PULSE_CALL_IDLE,
});
