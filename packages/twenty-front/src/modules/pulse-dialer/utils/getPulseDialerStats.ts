import { PULSE_DIALER_DISPOSITIONS } from '@/pulse-dialer/constants/PulseDialerDispositions';
import { type PulseDialerSession } from '@/pulse-dialer/states/pulseDialerSessionState';

const CONNECT_IDS = new Set<string>(
  PULSE_DIALER_DISPOSITIONS.filter((disposition) => disposition.isConnect).map(
    (disposition) => disposition.id,
  ),
);

export const getPulseDialerStats = (session: PulseDialerSession) => {
  const results = Object.values(session.results);
  const dialed = results.filter((result) => result.disposition !== 'skipped');
  const connected = dialed.filter((result) =>
    CONNECT_IDS.has(result.disposition),
  );

  return {
    dialed: dialed.length,
    connected: connected.length,
    connectRate:
      dialed.length === 0
        ? 0
        : Math.round((connected.length / dialed.length) * 100),
    talkSeconds: dialed.reduce((sum, result) => sum + result.talkSeconds, 0),
    remaining: Math.max(0, session.queue.length - session.index),
  };
};

export const formatTalkTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m ${String(rest).padStart(2, '0')}s`;
};
