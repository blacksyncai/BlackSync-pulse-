import { PLIVO_VOICE_ACCESS } from '@/pulse-calling/graphql/queries/plivoVoiceAccess';
import {
  PULSE_CALL_IDLE,
  pulseCallState,
} from '@/pulse-calling/states/pulseCallState';
import { useApolloClient } from '@apollo/client/react';
import { useStore } from 'jotai';
import { type Client } from 'plivo-browser-sdk/client';
import { isDefined } from 'twenty-shared/utils';

type PlivoVoiceAccessResult = {
  plivoVoiceAccess: { isEnabled: boolean; accessToken: string | null };
};

// Access tokens live one hour; sign in again a little before that.
const CLIENT_MAX_AGE_MS = 50 * 60 * 1000;

let plivoClientPromise: Promise<Client> | null = null;
let plivoClientCreatedAt = 0;

export class PulseCallingUnavailableError extends Error {}

export const usePulseCalling = () => {
  const store = useStore();
  const apolloClient = useApolloClient();

  const setCall = (update: Partial<typeof PULSE_CALL_IDLE>) =>
    store.set(pulseCallState.atom, (previous) => ({ ...previous, ...update }));

  const createClient = async (): Promise<Client> => {
    const { data } = await apolloClient.query<PlivoVoiceAccessResult>({
      query: PLIVO_VOICE_ACCESS,
      fetchPolicy: 'network-only',
    });

    const accessToken = data?.plivoVoiceAccess.accessToken;

    if (data?.plivoVoiceAccess.isEnabled !== true || !isDefined(accessToken)) {
      throw new PulseCallingUnavailableError();
    }

    const { default: Plivo } = await import('plivo-browser-sdk');
    const plivo = new Plivo({
      debug: 'ERROR',
      permOnClick: true,
      enableTracking: false,
      closeProtection: true,
    });
    const client = plivo.client;

    client.on('onCalling', () => setCall({ status: 'connecting' }));
    client.on('onCallRemoteRinging', () => setCall({ status: 'ringing' }));
    client.on('onCallAnswered', () =>
      setCall({ status: 'in-call', answeredAt: Date.now() }),
    );
    client.on('onCallTerminated', () => setCall({ status: 'ended' }));
    client.on('onCallFailed', (reason: unknown) =>
      setCall({
        status: 'failed',
        errorMessage: typeof reason === 'string' ? reason : null,
      }),
    );
    client.on('onMediaPermission', (event: { status?: string }) => {
      if (event?.status === 'failure') {
        setCall({
          status: 'failed',
          errorMessage: 'Microphone access was blocked',
        });
      }
    });

    await new Promise<void>((resolve, reject) => {
      client.on('onLogin', () => resolve());
      client.on('onLoginFailed', (reason: unknown) =>
        reject(new Error(String(reason))),
      );
      client.loginWithAccessToken(accessToken);
    });

    return client;
  };

  const getClient = async () => {
    const isStale = Date.now() - plivoClientCreatedAt > CLIENT_MAX_AGE_MS;

    if (isDefined(plivoClientPromise) && isStale) {
      const staleClient = await plivoClientPromise.catch(() => null);

      staleClient?.logout();
      plivoClientPromise = null;
    }

    if (!isDefined(plivoClientPromise)) {
      plivoClientCreatedAt = Date.now();
      plivoClientPromise = createClient().catch((error) => {
        plivoClientPromise = null;
        throw error;
      });
    }

    return plivoClientPromise;
  };

  const startCall = async (phoneNumber: string) => {
    const currentStatus = store.get(pulseCallState.atom).status;

    if (['connecting', 'ringing', 'in-call'].includes(currentStatus)) {
      return;
    }

    store.set(pulseCallState.atom, {
      ...PULSE_CALL_IDLE,
      status: 'connecting',
      phoneNumber,
    });

    try {
      const client = await getClient();

      client.call(phoneNumber, {});
    } catch (error) {
      store.set(pulseCallState.atom, PULSE_CALL_IDLE);
      throw error;
    }
  };

  const hangUp = async () => {
    const client = await plivoClientPromise?.catch(() => null);

    client?.hangup();
    setCall({ status: 'ended' });
  };

  const toggleMute = async () => {
    const client = await plivoClientPromise?.catch(() => null);
    const isMuted = store.get(pulseCallState.atom).isMuted;

    if (isMuted) {
      client?.unmute();
    } else {
      client?.mute();
    }
    setCall({ isMuted: !isMuted });
  };

  const dismiss = () => store.set(pulseCallState.atom, PULSE_CALL_IDLE);

  return { startCall, hangUp, toggleMute, dismiss };
};
