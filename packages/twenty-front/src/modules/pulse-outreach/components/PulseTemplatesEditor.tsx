import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import {
  StyledButton,
  StyledCard,
  StyledChip,
  StyledList,
  StyledListItem,
  StyledMuted,
  StyledPreview,
  StyledRow,
  StyledSplit,
} from '@/pulse-outreach/components/PulseOutreachStyles';
import { useEmailTemplates } from '@/pulse-outreach/hooks/usePulseOutreach';
import { type PulseEmailTemplate } from '@/pulse-outreach/types/PulseOutreach';
import {
  PULSE_TEMPLATE_VARIABLES,
  renderPulseTemplate,
} from '@/pulse-outreach/utils/renderPulseTemplate';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { IconPlus } from 'twenty-ui/icon';
import { v4 } from 'uuid';

const STARTER_TEMPLATE: Omit<PulseEmailTemplate, 'id'> = {
  name: 'Intro',
  subject: 'Quick question, {{first_name|there}}',
  body: 'Hi {{first_name|there}},\n\nI work with teams like {{company}} on ...\n\nWorth a quick call this week?\n\n{{sender_first_name}}',
};

export const PulseTemplatesEditor = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { templates, saveTemplates } = useEmailTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PulseEmailTemplate | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const selected =
    templates.find((template) => template.id === selectedId) ?? templates[0];
  const editing = draft?.id === selected?.id ? draft : (selected ?? null);

  const preview = (text: string) =>
    renderPulseTemplate(text, {
      firstName: 'Qawi',
      lastName: 'Alamin',
      companyName: 'Nexlink Capital',
      senderFirstName: currentWorkspaceMember?.name?.firstName ?? '',
      senderLastName: currentWorkspaceMember?.name?.lastName ?? '',
    });

  const createTemplate = async () => {
    const template = { ...STARTER_TEMPLATE, id: v4() };

    await saveTemplates([...templates, template]);
    setSelectedId(template.id);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!isDefined(editing)) {
      return;
    }

    await saveTemplates(
      templates.map((template) =>
        template.id === editing.id ? editing : template,
      ),
    );
    setDraft(null);
    enqueueToast({ variant: 'success', children: t`Template saved` });
  };

  const deleteTemplate = async () => {
    if (
      isDefined(editing) &&
      window.confirm(t`Delete the "${editing.name}" template?`)
    ) {
      await saveTemplates(
        templates.filter((template) => template.id !== editing.id),
      );
      setSelectedId(null);
      setDraft(null);
    }
  };

  const insertVariable = (name: string) => {
    if (!isDefined(editing)) {
      return;
    }

    const token = `{{${name}}}`;
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? editing.body.length;
    const end = textarea?.selectionEnd ?? editing.body.length;

    setDraft({
      ...editing,
      body: editing.body.slice(0, start) + token + editing.body.slice(end),
    });
  };

  return (
    <StyledSplit>
      <StyledList>
        {templates.map((template) => (
          <StyledListItem
            key={template.id}
            type="button"
            aria-pressed={template.id === editing?.id}
            onClick={() => {
              setSelectedId(template.id);
              setDraft(null);
            }}
          >
            {template.name || t`Untitled`}
            <small>{template.subject}</small>
          </StyledListItem>
        ))}
        <StyledButton type="button" onClick={() => void createTemplate()}>
          <IconPlus size={14} />
          {t`New template`}
        </StyledButton>
      </StyledList>

      {isDefined(editing) ? (
        <StyledCard>
          <label>
            {t`Template name`}
            <input
              value={editing.name}
              onChange={(event) =>
                setDraft({ ...editing, name: event.target.value })
              }
            />
          </label>
          <label>
            {t`Subject`}
            <input
              value={editing.subject}
              onChange={(event) =>
                setDraft({ ...editing, subject: event.target.value })
              }
            />
          </label>
          <label>
            {t`Message`}
            <textarea
              ref={bodyRef}
              value={editing.body}
              onChange={(event) =>
                setDraft({ ...editing, body: event.target.value })
              }
            />
          </label>
          <StyledRow>
            <StyledMuted>{t`Insert:`}</StyledMuted>
            {PULSE_TEMPLATE_VARIABLES.map((variable) => (
              <StyledChip
                key={variable.name}
                type="button"
                onClick={() => insertVariable(variable.name)}
              >
                {variable.label}
              </StyledChip>
            ))}
          </StyledRow>
          <StyledMuted>
            {t`Add a fallback after a bar for contacts missing a value, for example`}{' '}
            {'{{first_name|there}}'}
          </StyledMuted>
          <StyledPreview>
            <strong>{preview(editing.subject)}</strong>
            {preview(editing.body)}
          </StyledPreview>
          <StyledRow style={{ justifyContent: 'space-between' }}>
            <StyledButton
              type="button"
              data-tone="danger"
              onClick={() => void deleteTemplate()}
            >
              {t`Delete`}
            </StyledButton>
            <StyledButton
              type="button"
              data-primary
              disabled={draft === null}
              onClick={() => void saveDraft()}
            >
              {t`Save template`}
            </StyledButton>
          </StyledRow>
        </StyledCard>
      ) : (
        <StyledCard>
          <StyledMuted>
            {t`No templates yet. Create one with personal variables and reuse it for one-off emails and sequences.`}
          </StyledMuted>
        </StyledCard>
      )}
    </StyledSplit>
  );
};
