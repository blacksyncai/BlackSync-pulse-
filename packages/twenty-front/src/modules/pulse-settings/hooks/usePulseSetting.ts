import {
  PULSE_SETTING,
  SET_PULSE_SETTING,
} from '@/pulse-settings/graphql/pulseSetting';
import { useApolloClient, useQuery } from '@apollo/client/react';
import { isDefined } from 'twenty-shared/utils';

export type PulseSettingKey =
  | 'smartViews'
  | 'dealCardLayout'
  | 'emailTemplates'
  | 'sequences'
  | 'notificationPreferences';

// Workspace-wide settings shared by every member, saved on the server.
export const usePulseSetting = <TValue>(
  key: PulseSettingKey,
  defaultValue: TValue,
) => {
  const apolloClient = useApolloClient();
  const { data, loading } = useQuery<{ pulseSetting: TValue | null }>(
    PULSE_SETTING,
    { variables: { key } },
  );
  const value = isDefined(data?.pulseSetting)
    ? data.pulseSetting
    : defaultValue;

  const save = async (nextValue: TValue) => {
    apolloClient.writeQuery({
      query: PULSE_SETTING,
      variables: { key },
      data: { pulseSetting: nextValue },
    });
    await apolloClient.mutate({
      mutation: SET_PULSE_SETTING,
      variables: { key, value: nextValue },
    });
  };

  return { value, save, loading };
};
