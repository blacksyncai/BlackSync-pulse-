export type PulseDialerDispositionId =
  | 'connected'
  | 'interested'
  | 'not_interested'
  | 'callback'
  | 'voicemail'
  | 'no_answer'
  | 'busy'
  | 'wrong_number';

export const PULSE_DIALER_DISPOSITIONS: {
  id: PulseDialerDispositionId;
  label: string;
  isConnect: boolean;
  color: string;
  shortcut: string;
}[] = [
  {
    id: 'connected',
    label: 'Connected',
    isConnect: true,
    color: 'blue',
    shortcut: '1',
  },
  {
    id: 'interested',
    label: 'Interested',
    isConnect: true,
    color: 'green',
    shortcut: '2',
  },
  {
    id: 'not_interested',
    label: 'Not interested',
    isConnect: true,
    color: 'red',
    shortcut: '3',
  },
  {
    id: 'callback',
    label: 'Call back later',
    isConnect: true,
    color: 'purple',
    shortcut: '4',
  },
  {
    id: 'voicemail',
    label: 'Left voicemail',
    isConnect: false,
    color: 'orange',
    shortcut: '5',
  },
  {
    id: 'no_answer',
    label: 'No answer',
    isConnect: false,
    color: 'gray',
    shortcut: '6',
  },
  {
    id: 'busy',
    label: 'Busy',
    isConnect: false,
    color: 'yellow',
    shortcut: '7',
  },
  {
    id: 'wrong_number',
    label: 'Wrong number',
    isConnect: false,
    color: 'pink',
    shortcut: '8',
  },
];
