import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { usePulseCalling } from '@/pulse-calling/hooks/usePulseCalling';
import {
  PULSE_CALL_IDLE,
  pulseCallState,
} from '@/pulse-calling/states/pulseCallState';
import {
  PULSE_DIALER_DISPOSITIONS,
  type PulseDialerDispositionId,
} from '@/pulse-dialer/constants/PulseDialerDispositions';
import {
  PULSE_DIALER_EMPTY_SESSION,
  type PulseDialerLead,
  pulseDialerSessionState,
} from '@/pulse-dialer/states/pulseDialerSessionState';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { formatCallDuration } from '@/pulse-dialer/utils/formatCallDuration';
import { useStore } from 'jotai';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export type PulseDialerOutcome = {
  disposition: PulseDialerDispositionId;
  notes: string;
  leadStatus: string | null;
  callbackAt: Date | null;
};

export const usePulseDialer = () => {
  const store = useStore();
  const session = useAtomStateValue(pulseDialerSessionState);
  const call = useAtomStateValue(pulseCallState);
  const { startCall, hangUp } = usePulseCalling();
  const { updateOneRecord } = useUpdateOneRecord();
  const { addTask, addNote } = usePulseTaskActions();

  const current: PulseDialerLead | undefined = session.queue[session.index];
  const isCallActive = ['connecting', 'ringing', 'in-call'].includes(
    call.status,
  );
  const isAwaitingOutcome =
    (call.status === 'ended' || call.status === 'failed') &&
    isDefined(current) &&
    call.companyId === current.companyId;

  const setSession = (
    update: (
      previous: typeof PULSE_DIALER_EMPTY_SESSION,
    ) => typeof PULSE_DIALER_EMPTY_SESSION,
  ) => store.set(pulseDialerSessionState.atom, update);

  const start = (queue: PulseDialerLead[], sourceLabel: string) => {
    store.set(pulseCallState.atom, PULSE_CALL_IDLE);
    setSession((previous) => ({
      ...PULSE_DIALER_EMPTY_SESSION,
      isAutoDial: previous.isAutoDial,
      queue,
      sourceLabel,
      startedAt: Date.now(),
    }));
  };

  const dial = async (lead: PulseDialerLead | undefined = current) => {
    if (!isDefined(lead) || isCallActive) {
      return;
    }

    store.set(pulseCallState.atom, PULSE_CALL_IDLE);
    await startCall(lead.phone, {
      personId: lead.personId,
      companyId: lead.companyId,
    });
  };

  const advance = () => {
    store.set(pulseCallState.atom, PULSE_CALL_IDLE);
    setSession((previous) => ({ ...previous, index: previous.index + 1 }));

    const next = store.get(pulseDialerSessionState.atom);

    return next.queue[next.index];
  };

  const skip = () => {
    if (!isDefined(current)) {
      return;
    }

    if (isCallActive) {
      void hangUp();
    }

    setSession((previous) => ({
      ...previous,
      results: {
        ...previous.results,
        [current.companyId]: {
          disposition: 'skipped',
          at: Date.now(),
          talkSeconds: 0,
        },
      },
    }));

    return advance();
  };

  const jumpTo = (index: number) => {
    store.set(pulseCallState.atom, PULSE_CALL_IDLE);
    setSession((previous) => ({ ...previous, index }));
  };

  // The call itself was logged when it ended; the outcome and notes are written onto
  // that same timeline entry so each dial shows once with what happened.
  const saveOutcome = async (outcome: PulseDialerOutcome) => {
    if (!isDefined(current)) {
      return undefined;
    }

    const endedCall = store.get(pulseCallState.atom);
    const disposition = PULSE_DIALER_DISPOSITIONS.find(
      (option) => option.id === outcome.disposition,
    );
    const talkSeconds =
      isDefined(endedCall.answeredAt) && isDefined(endedCall.endedAt)
        ? Math.max(
            0,
            Math.round((endedCall.endedAt - endedCall.answeredAt) / 1000),
          )
        : 0;
    const notes = outcome.notes.trim();

    if (isDefined(endedCall.loggedNoteId)) {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Note,
        idToUpdate: endedCall.loggedNoteId,
        updateOneRecordInput: {
          title: [
            'Outbound call',
            formatCallDuration(talkSeconds),
            disposition?.label ?? outcome.disposition,
          ].join(' · '),
          ...(notes.length > 0
            ? {
                bodyV2: {
                  markdown: `Phone: ${current.phone}\n\n${notes}`,
                  blocknote: null,
                },
              }
            : {}),
        },
      });
    } else if (notes.length > 0) {
      await addNote({
        body: `Call: ${disposition?.label ?? outcome.disposition}\n\n${notes}`,
        companyId: current.companyId,
        personId: current.personId,
      });
    }

    if (isDefined(outcome.leadStatus)) {
      await updateOneRecord({
        objectNameSingular: CoreObjectNameSingular.Company,
        idToUpdate: current.companyId,
        updateOneRecordInput: { leadStatus: outcome.leadStatus },
      });
    }

    if (isDefined(outcome.callbackAt)) {
      await addTask({
        title: `Call back ${current.contactName || current.leadName}`,
        dueAt: outcome.callbackAt,
        isUrgent: false,
        companyId: current.companyId,
        personId: current.personId,
      });
    }

    setSession((previous) => ({
      ...previous,
      results: {
        ...previous.results,
        [current.companyId]: {
          disposition: outcome.disposition,
          at: Date.now(),
          talkSeconds,
        },
      },
    }));

    return advance();
  };

  const setAutoDial = (isAutoDial: boolean) =>
    setSession((previous) => ({ ...previous, isAutoDial }));

  const end = () => {
    if (isCallActive) {
      void hangUp();
    }

    store.set(pulseCallState.atom, PULSE_CALL_IDLE);
    setSession((previous) => ({
      ...PULSE_DIALER_EMPTY_SESSION,
      isAutoDial: previous.isAutoDial,
    }));
  };

  return {
    session,
    call,
    current,
    isCallActive,
    isAwaitingOutcome,
    start,
    dial,
    skip,
    jumpTo,
    saveOutcome,
    setAutoDial,
    hangUp,
    end,
  };
};
