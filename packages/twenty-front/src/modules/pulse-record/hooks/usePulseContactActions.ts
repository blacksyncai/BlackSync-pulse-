import {
  PulseCallingUnavailableError,
  usePulseCalling,
} from '@/pulse-calling/hooks/usePulseCalling';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';

export const formatContactPhone = (
  phones:
    | {
        primaryPhoneNumber: string | null;
        primaryPhoneCallingCode: string | null;
      }
    | null
    | undefined,
) =>
  isDefined(phones?.primaryPhoneNumber) && phones.primaryPhoneNumber.length > 0
    ? `${phones.primaryPhoneCallingCode ?? ''}${phones.primaryPhoneNumber}`
    : null;

export const usePulseContactActions = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { startCall } = usePulseCalling();

  const call = async (
    phoneNumber: string | null | undefined,
    context: { personId?: string | null; companyId?: string | null } = {},
  ) => {
    if (!isDefined(phoneNumber)) {
      enqueueToast({
        variant: 'error',
        children: t`No phone number on this contact yet.`,
      });

      return;
    }

    try {
      await startCall(phoneNumber, context);
    } catch (error) {
      if (error instanceof PulseCallingUnavailableError) {
        window.location.href = `tel:${phoneNumber}`;

        return;
      }

      enqueueToast({
        variant: 'error',
        children: t`Could not start the call. Check your microphone and Plivo settings.`,
      });
    }
  };

  const email = (address: string | null | undefined) => {
    if (isDefined(address) && address.length > 0) {
      window.open(`mailto:${address}`, '_blank');
    }
  };

  const text = (phoneNumber: string | null | undefined) => {
    if (isDefined(phoneNumber)) {
      window.location.href = `sms:${phoneNumber}`;
    }
  };

  return { call, email, text };
};
