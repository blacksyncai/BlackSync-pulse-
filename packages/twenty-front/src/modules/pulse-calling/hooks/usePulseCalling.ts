import { LOG_PULSE_CALL } from '@/pulse-calling/graphql/mutations/logPulseCall';
import { PLIVO_VOICE_ACCESS } from '@/pulse-calling/graphql/queries/plivoVoiceAccess';
import {
  PULSE_CALL_IDLE,
  pulseCallState,
} from '@/pulse-calling/states/pulseCallState';
import {
  type PulseCallSettings,
  pulseCallSettingsState,
} from '@/pulse-calling/states/pulseCallSettingsState';
import { useApolloClient } from '@apollo/client/react';
import { useStore } from 'jotai';
import { type Client } from 'plivo-browser-sdk/client';
import { isDefined } from 'twenty-shared/utils';

export type PlivoVoiceAccessResult = {
  plivoVoiceAccess: {
    isEnabled: boolean;
    accessToken: string | null;
    defaultCallerId: string | null;
    callerIds: { number: string; label: string | null }[];
  };
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

  // Every dial is logged once, when it ends, whether or not anyone picked up.
  const logEndedCall = (outcome: 'answered' | 'no-answer' | 'failed') => {
    const call = store.get(pulseCallState.atom);

    if (call.isLogged || !isDefined(call.phoneNumber)) {
      return;
    }

    setCall({ isLogged: true });

    void apolloClient
      .mutate({
        mutation: LOG_PULSE_CALL,
        variables: {
          input: {
            phoneNumber: call.phoneNumber,
            durationSeconds: isDefined(call.answeredAt)
              ? Math.round((Date.now() - call.answeredAt) / 1000)
              : 0,
            outcome: isDefined(call.answeredAt) ? 'answered' : outcome,
            callUuid: call.callUuid,
            personId: call.personId,
            companyId: call.companyId,
            isRecorded: call.isRecorded,
          },
        },
      })
      .catch(() => setCall({ isLogged: false }));
  };

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
    client.on('onCallRemoteRinging', () =>
      setCall({ status: 'ringing', callUuid: client.getCallUUID() }),
    );
    client.on('onCallAnswered', () =>
      setCall({
        status: 'in-call',
        answeredAt: Date.now(),
        callUuid: client.getCallUUID(),
      }),
    );
    client.on('onCallTerminated', () => {
      logEndedCall('no-answer');
      setCall({ status: 'ended' });
    });
    client.on('onCallFailed', (reason: unknown) => {
      logEndedCall('failed');
      setCall({
        status: 'failed',
        errorMessage: typeof reason === 'string' ? reason : null,
      });
    });
    client.on('onPermissionDenied', () =>
      setCall({
        status: 'failed',
        errorMessage: 'Calling is not allowed for this phone line',
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

  const applyAudioDevices = (client: Client, settings: PulseCallSettings) => {
    if (isDefined(settings.speakerDeviceId)) {
      client.audio.speakerDevices.set(settings.speakerDeviceId);
    }

    if (isDefined(settings.ringtoneDeviceId)) {
      client.audio.ringtoneDevices.set(settings.ringtoneDeviceId);
    }

    if (isDefined(settings.microphoneDeviceId)) {
      client.audio.microphoneDevices.set(settings.microphoneDeviceId);
    }
  };

  const startCall = async (
    phoneNumber: string,
    context: { personId?: string | null; companyId?: string | null } = {},
  ) => {
    const currentStatus = store.get(pulseCallState.atom).status;

    if (['connecting', 'ringing', 'in-call'].includes(currentStatus)) {
      return;
    }

    store.set(pulseCallState.atom, {
      ...PULSE_CALL_IDLE,
      status: 'connecting',
      phoneNumber,
      personId: context.personId ?? null,
      companyId: context.companyId ?? null,
      isRecorded: store.get(pulseCallSettingsState.atom).autoRecord,
    });

    try {
      const client = await getClient();
      const settings = store.get(pulseCallSettingsState.atom);

      applyAudioDevices(client, settings);
      // Plivo forwards X-PH- headers to the answer webhook, which validates them.
      const isPlaced = client.call(phoneNumber, {
        ...(isDefined(settings.callerId)
          ? { 'X-PH-Callerid': settings.callerId }
          : {}),
        ...(settings.autoRecord ? { 'X-PH-Record': '1' } : {}),
      });

      if (isPlaced === false) {
        setCall({
          status: 'failed',
          errorMessage: 'The call could not be placed, try again',
        });
      }
    } catch (error) {
      store.set(pulseCallState.atom, PULSE_CALL_IDLE);
      throw error;
    }
  };

  const hangUp = async () => {
    const client = await plivoClientPromise?.catch(() => null);

    client?.hangup();
    logEndedCall('no-answer');
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
