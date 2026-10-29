import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import {
  StyledButton,
  StyledCard,
  StyledMuted,
  StyledRow,
} from '@/pulse-outreach/components/PulseOutreachStyles';
import {
  useEmailTemplates,
  useOutreachActions,
  useOutreachStatus,
} from '@/pulse-outreach/hooks/usePulseOutreach';
import { renderPulseTemplate } from '@/pulse-outreach/utils/renderPulseTemplate';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';

export type PulseEmailRecipient = {
  personId: string;
  email: string;
  firstName: string;
  lastName: string;
};

type PulseEmailComposerProps = {
  recipients: PulseEmailRecipient[];
  companyName: string;
  onDone: () => void;
};

export const PulseEmailComposer = ({
  recipients,
  companyName,
  onDone,
}: PulseEmailComposerProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const status = useOutreachStatus();
  const { templates } = useEmailTemplates();
  const { sendEmail } = useOutreachActions();
  const [personId, setPersonId] = useState(recipients[0]?.personId ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const recipient = recipients.find((option) => option.personId === personId);

  const applyTemplate = (templateId: string) => {
    const template = templates.find((option) => option.id === templateId);

    if (!isDefined(template)) {
      return;
    }

    const context = {
      firstName: recipient?.firstName ?? '',
      lastName: recipient?.lastName ?? '',
      companyName,
      senderFirstName: currentWorkspaceMember?.name?.firstName ?? '',
      senderLastName: currentWorkspaceMember?.name?.lastName ?? '',
    };

    setSubject(renderPulseTemplate(template.subject, context));
    setBody(renderPulseTemplate(template.body, context));
  };

  const handleSend = async () => {
    if (!isDefined(recipient)) {
      return;
    }

    if (status?.canSend !== true) {
      window.open(
        `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        '_blank',
      );
      onDone();

      return;
    }

    setIsSending(true);

    try {
      await sendEmail({ personId: recipient.personId, subject, body });
      enqueueToast({
        variant: 'success',
        children: t`Sent to ${recipient.email}`,
      });
      onDone();
    } catch (error) {
      enqueueToast({
        variant: 'error',
        children:
          error instanceof Error ? error.message : t`The email was not sent.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (recipients.length === 0) {
    return (
      <StyledCard>
        <StyledMuted>{t`None of this lead's contacts has an email address yet.`}</StyledMuted>
        <StyledRow>
          <StyledButton type="button" onClick={onDone}>
            {t`Close`}
          </StyledButton>
        </StyledRow>
      </StyledCard>
    );
  }

  return (
    <StyledCard>
      <StyledRow>
        <label style={{ flex: 1 }}>
          {t`To`}
          <select
            value={personId}
            onChange={(event) => setPersonId(event.target.value)}
          >
            {recipients.map((option) => (
              <option key={option.personId} value={option.personId}>
                {[option.firstName, option.lastName].filter(Boolean).join(' ')}{' '}
                &lt;{option.email}&gt;
              </option>
            ))}
          </select>
        </label>
        {templates.length > 0 && (
          <label>
            {t`Template`}
            <select
              value=""
              onChange={(event) => applyTemplate(event.target.value)}
            >
              <option value="" disabled>
                {t`Use a template...`}
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </StyledRow>
      <label>
        {t`Subject`}
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
      </label>
      <label>
        {t`Message`}
        <textarea
          autoFocus
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <StyledRow style={{ justifyContent: 'space-between' }}>
        <StyledMuted>
          {status?.canSend === true
            ? t`Logged on this lead's timeline after sending.`
            : t`Sending from Pulse isn't on yet, so this opens your mail app.`}
        </StyledMuted>
        <StyledRow>
          <StyledButton type="button" onClick={onDone}>
            {t`Cancel`}
          </StyledButton>
          <StyledButton
            type="button"
            data-primary
            disabled={
              isSending ||
              subject.trim().length === 0 ||
              body.trim().length === 0
            }
            onClick={() => void handleSend()}
          >
            {isSending ? t`Sending...` : t`Send`}
          </StyledButton>
        </StyledRow>
      </StyledRow>
    </StyledCard>
  );
};
