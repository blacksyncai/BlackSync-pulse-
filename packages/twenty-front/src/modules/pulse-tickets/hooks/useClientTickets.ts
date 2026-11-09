import { gql } from '@apollo/client';
import { useApolloClient, useQuery } from '@apollo/client/react';

const QUERY = gql`
  query PulseClientTickets {
    pulseClientTickets
  }
`;
const SETUP = gql`
  mutation SetupPulseClientTickets {
    setupPulseClientTickets
  }
`;
const SAVE = gql`
  mutation SavePulseTicketEmailRule($rule: JSON!) {
    savePulseTicketEmailRule(rule: $rule)
  }
`;
export type TicketMailboxRule = {
  channelId: string;
  enabled: boolean;
  keywords: string[];
};
export type ClientTicketSettings = {
  board: { href: string; viewId: string } | null;
  mailboxes: { id: string; handle: string; isSyncEnabled: boolean }[];
  rules: TicketMailboxRule[];
};
export const useClientTickets = () => {
  const client = useApolloClient();
  const { data, loading, error, refetch } = useQuery<{
    pulseClientTickets: ClientTicketSettings;
  }>(QUERY);
  return {
    settings: data?.pulseClientTickets,
    loading,
    error,
    refetch,
    setup: async () => {
      const result = await client.mutate<{
        setupPulseClientTickets: { href: string };
      }>({ mutation: SETUP });
      await refetch();
      return result.data?.setupPulseClientTickets;
    },
    saveRule: async (rule: TicketMailboxRule) => {
      await client.mutate({ mutation: SAVE, variables: { rule } });
      await refetch();
    },
  };
};
