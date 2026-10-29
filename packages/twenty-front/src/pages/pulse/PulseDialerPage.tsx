import { PulseDialerSession } from '@/pulse-dialer/components/PulseDialerSession';
import { PulseDialerStart } from '@/pulse-dialer/components/PulseDialerStart';
import { pulseDialerSessionState } from '@/pulse-dialer/states/pulseDialerSessionState';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { IconPhone } from 'twenty-ui/icon';

export const PulseDialerPage = () => {
  const { t } = useLingui();
  const session = useAtomStateValue(pulseDialerSessionState);

  return (
    <PageCardLayout
      header={<PageHeader title={t`Power dialer`} Icon={IconPhone} />}
    >
      {session.queue.length === 0 ? (
        <PulseDialerStart />
      ) : (
        <PulseDialerSession />
      )}
    </PageCardLayout>
  );
};
