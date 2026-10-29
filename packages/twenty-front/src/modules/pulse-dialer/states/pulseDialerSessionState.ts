import { type PulseDialerDispositionId } from '@/pulse-dialer/constants/PulseDialerDispositions';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type PulseDialerLead = {
  companyId: string;
  personId: string | null;
  leadName: string;
  contactName: string;
  phone: string;
};

export type PulseDialerResult = {
  disposition: PulseDialerDispositionId | 'skipped';
  at: number;
  talkSeconds: number;
};

export type PulseDialerSession = {
  queue: PulseDialerLead[];
  index: number;
  results: Record<string, PulseDialerResult>;
  startedAt: number | null;
  sourceLabel: string;
  isAutoDial: boolean;
};

export const PULSE_DIALER_EMPTY_SESSION: PulseDialerSession = {
  queue: [],
  index: 0,
  results: {},
  startedAt: null,
  sourceLabel: '',
  isAutoDial: true,
};

// Kept in local storage so a refresh mid-session picks up where you left off.
export const pulseDialerSessionState = createAtomState<PulseDialerSession>({
  key: 'pulseDialerSession',
  defaultValue: PULSE_DIALER_EMPTY_SESSION,
  useLocalStorage: true,
});
