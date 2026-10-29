import { PULSE_LEADS } from '@/pulse-leads/graphql/pulseLeads';
import { type PulseLead } from '@/pulse-leads/types/PulseLead';
import { useQuery } from '@apollo/client/react';

export const usePulseLeads = () => {
  const { data, loading, refetch } = useQuery<{ pulseLeads: PulseLead[] }>(
    PULSE_LEADS,
    { fetchPolicy: 'cache-and-network' },
  );

  return {
    leads: data?.pulseLeads ?? [],
    loading: loading && !data,
    refetch,
  };
};
