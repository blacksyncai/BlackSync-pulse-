import { useFieldFocus } from '@/object-record/record-field/ui/hooks/useFieldFocus';
import { usePhonesFieldDisplay } from '@/object-record/record-field/ui/meta-types/hooks/usePhonesFieldDisplay';
import {
  PulseCallingUnavailableError,
  usePulseCalling,
} from '@/pulse-calling/hooks/usePulseCalling';
import { PhonesDisplay } from '@/ui/field/display/components/PhonesDisplay';
import { useLingui } from '@lingui/react/macro';
import React from 'react';
import { FieldMetadataSettingsOnClickAction } from 'twenty-shared/types';
import { useToast } from 'twenty-ui/components';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';

export const PhonesFieldDisplay = () => {
  const { fieldValue, fieldDefinition } = usePhonesFieldDisplay();
  const { copyToClipboard } = useCopyToClipboard();
  const { isFocused } = useFieldFocus();
  const { startCall } = usePulseCalling();
  const { enqueueToast } = useToast();

  const { t } = useLingui();

  const onClickAction = fieldDefinition.metadata.settings?.clickAction;

  const handleClick = async (
    phoneNumber: string,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    if (onClickAction === FieldMetadataSettingsOnClickAction.COPY) {
      event.preventDefault();
      copyToClipboard(phoneNumber, t`Phone number copied to clipboard`);
      return;
    }

    // Call from the browser through Plivo; fall back to the device dialer
    // when calling is not set up on this server.
    event.preventDefault();
    event.stopPropagation();

    try {
      await startCall(phoneNumber);
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

  return (
    <PhonesDisplay
      value={fieldValue}
      isFocused={isFocused}
      onPhoneNumberClick={handleClick}
    />
  );
};
