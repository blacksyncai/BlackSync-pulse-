import { useSmartViews } from '@/pulse-leads/hooks/useSmartViews';
import { usePulseLeads } from '@/pulse-leads/hooks/usePulseLeads';
import { applySmartView } from '@/pulse-leads/utils/applySmartView';
import { usePulseDialer } from '@/pulse-dialer/hooks/usePulseDialer';
import { toPulseDialerQueue } from '@/pulse-dialer/utils/toPulseDialerQueue';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconPhone } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledCard = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  margin: ${themeCssVariables.spacing[10]} auto;
  max-width: 520px;
  padding: ${themeCssVariables.spacing[8]};
  text-align: center;

  h2 {
    color: ${themeCssVariables.font.color.primary};
    font-size: 22px;
    margin: 0;
  }

  p {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.md};
    margin: 0;
  }

  select {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 40px;
    padding: 0 ${themeCssVariables.spacing[3]};
    width: 100%;
  }
`;

const StyledStartButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.accent.accent9};
  border: 0;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  height: 48px;
  justify-content: center;
  width: 100%;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

export const PulseDialerStart = () => {
  const { t } = useLingui();
  const { smartViews } = useSmartViews();
  const { leads } = usePulseLeads();
  const { currentWorkspaceMemberId } = usePulseTaskActions();
  const { start } = usePulseDialer();
  const [viewId, setViewId] = useState(smartViews[1]?.id ?? smartViews[0].id);
  const view =
    smartViews.find((candidate) => candidate.id === viewId) ?? smartViews[0];
  const queue = toPulseDialerQueue(
    applySmartView(leads, view, { now: Date.now(), currentWorkspaceMemberId }),
  );

  return (
    <StyledCard>
      <IconPhone size={32} />
      <h2>{t`Power dialer`}</h2>
      <p>{t`Pick a Smart View and call straight down the list. Log what happened after each call and the next one dials by itself.`}</p>
      <select
        aria-label={t`Smart View`}
        value={view.id}
        onChange={(event) => setViewId(event.target.value)}
      >
        {smartViews.map((candidate) => (
          <option key={candidate.id} value={candidate.id}>
            {candidate.name}
          </option>
        ))}
      </select>
      <StyledStartButton
        type="button"
        disabled={queue.length === 0}
        onClick={() => start(queue, view.name)}
      >
        <IconPhone size={18} />
        {queue.length === 0
          ? t`No leads with a phone number here`
          : t`Start dialing ${queue.length} leads`}
      </StyledStartButton>
      <p>{t`You can also select leads on the Leads page and click Dial selected.`}</p>
    </StyledCard>
  );
};
