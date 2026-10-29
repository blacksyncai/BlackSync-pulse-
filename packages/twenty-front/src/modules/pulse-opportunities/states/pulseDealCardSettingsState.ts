import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type PulseDealCardField =
  | 'value'
  | 'contact'
  | 'closeDate'
  | 'lastActivity'
  | 'owner'
  | 'website'
  | 'note';

export type PulseDealCardSettings = Record<PulseDealCardField, boolean>;

export const PULSE_DEAL_CARD_SETTINGS_DEFAULT: PulseDealCardSettings = {
  value: true,
  contact: true,
  closeDate: true,
  lastActivity: true,
  owner: false,
  website: false,
  note: true,
};

export const pulseDealCardSettingsState =
  createAtomState<PulseDealCardSettings>({
    key: 'pulseDealCardSettings',
    defaultValue: PULSE_DEAL_CARD_SETTINGS_DEFAULT,
    useLocalStorage: true,
  });
