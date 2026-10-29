import { formatCallDuration } from '@/pulse-dialer/utils/formatCallDuration';
import { useEffect, useState } from 'react';

type PulseDialerTimerProps = {
  since: number;
};

export const PulseDialerTimer = ({ since }: PulseDialerTimerProps) => {
  const [now, setNow] = useState(Date.now);

  // A ticking clock is a subscription to time, which no event handler can drive.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>{formatCallDuration(Math.max(0, Math.round((now - since) / 1000)))}</>
  );
};
