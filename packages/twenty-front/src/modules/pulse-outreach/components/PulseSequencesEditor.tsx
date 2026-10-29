import {
  StyledButton,
  StyledCard,
  StyledList,
  StyledListItem,
  StyledMuted,
  StyledRow,
  StyledSplit,
} from '@/pulse-outreach/components/PulseOutreachStyles';
import {
  useEmailTemplates,
  useOutreachActions,
  useSequenceEnrollments,
  useSequences,
} from '@/pulse-outreach/hooks/usePulseOutreach';
import {
  type PulseEnrollment,
  type PulseSequence,
} from '@/pulse-outreach/types/PulseOutreach';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { IconPlus, IconTrash } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { v4 } from 'uuid';

const StyledStep = styled.div`
  align-items: center;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 10px;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 70px 1fr 170px 32px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  strong {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.md};
  }

  input {
    width: 56px;
  }

  button {
    align-items: center;
    background: transparent;
    border: 0;
    color: ${themeCssVariables.font.color.tertiary};
    cursor: pointer;
    display: flex;
    justify-content: center;
  }
`;

const StyledWait = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 6px;
`;

const StyledStats = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(5, 1fr);

  div {
    background: ${themeCssVariables.background.secondary};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.tertiary};
    display: flex;
    flex-direction: column;
    font-size: ${themeCssVariables.font.size.sm};
    padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  }

  strong {
    color: ${themeCssVariables.font.color.primary};
    font-size: 20px;
  }
`;

const StyledEnrollment = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: grid;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 1.4fr 1.2fr 90px 110px 70px;
  padding: ${themeCssVariables.spacing[2]} 0;

  small {
    color: ${themeCssVariables.font.color.tertiary};
    display: block;
    font-size: ${themeCssVariables.font.size.sm};
  }

  button {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.accent.accent10};
    cursor: pointer;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.sm};
    padding: 0;
    text-align: left;
  }
`;

const StyledStatus = styled.span`
  border-radius: 999px;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  justify-self: start;
  padding: 2px 8px;
  text-transform: capitalize;
`;

const STATUS_COLORS: Record<PulseEnrollment['status'], string> = {
  active: 'blue',
  finished: 'gray',
  stopped: 'gray',
  replied: 'green',
  failed: 'red',
};

const formatWhen = (value: string | null) =>
  isDefined(value)
    ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

export const PulseSequencesEditor = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { templates } = useEmailTemplates();
  const { sequences, saveSequences } = useSequences();
  const { enrollments } = useSequenceEnrollments();
  const { stopEnrollment } = useOutreachActions();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PulseSequence | null>(null);

  const selected =
    sequences.find((sequence) => sequence.id === selectedId) ?? sequences[0];
  const editing = draft?.id === selected?.id ? draft : (selected ?? null);
  const sequenceEnrollments = enrollments.filter(
    (enrollment) => enrollment.sequenceId === editing?.id,
  );
  const countBy = (status: PulseEnrollment['status']) =>
    sequenceEnrollments.filter((enrollment) => enrollment.status === status)
      .length;

  const createSequence = async () => {
    const sequence: PulseSequence = {
      id: v4(),
      name: t`New sequence`,
      isActive: true,
      steps: isDefined(templates[0])
        ? [{ id: v4(), templateId: templates[0].id, delayDays: 0 }]
        : [],
    };

    await saveSequences([...sequences, sequence]);
    setSelectedId(sequence.id);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!isDefined(editing)) {
      return;
    }

    await saveSequences(
      sequences.map((sequence) =>
        sequence.id === editing.id ? editing : sequence,
      ),
    );
    setDraft(null);
    enqueueToast({ variant: 'success', children: t`Sequence saved` });
  };

  const deleteSequence = async () => {
    if (
      isDefined(editing) &&
      window.confirm(
        t`Delete "${editing.name}"? People still in it stop getting emails.`,
      )
    ) {
      await saveSequences(
        sequences.filter((sequence) => sequence.id !== editing.id),
      );
      setSelectedId(null);
      setDraft(null);
    }
  };

  const updateStep = (
    index: number,
    patch: Partial<PulseSequence['steps'][number]>,
  ) =>
    isDefined(editing) &&
    setDraft({
      ...editing,
      steps: editing.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...patch } : step,
      ),
    });

  return (
    <StyledSplit>
      <StyledList>
        {sequences.map((sequence) => (
          <StyledListItem
            key={sequence.id}
            type="button"
            aria-pressed={sequence.id === editing?.id}
            onClick={() => {
              setSelectedId(sequence.id);
              setDraft(null);
            }}
          >
            {sequence.name}
            <small>
              {t`${sequence.steps.length} steps`} ·{' '}
              {sequence.isActive ? t`On` : t`Paused`}
            </small>
          </StyledListItem>
        ))}
        <StyledButton
          type="button"
          disabled={templates.length === 0}
          onClick={() => void createSequence()}
        >
          <IconPlus size={14} />
          {t`New sequence`}
        </StyledButton>
        {templates.length === 0 && (
          <StyledMuted>{t`Create a template first.`}</StyledMuted>
        )}
      </StyledList>

      {isDefined(editing) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StyledCard>
            <StyledRow style={{ justifyContent: 'space-between' }}>
              <label style={{ flex: 1 }}>
                {t`Sequence name`}
                <input
                  value={editing.name}
                  onChange={(event) =>
                    setDraft({ ...editing, name: event.target.value })
                  }
                />
              </label>
              <label>
                {t`Sending`}
                <select
                  value={editing.isActive ? 'on' : 'off'}
                  onChange={(event) =>
                    setDraft({
                      ...editing,
                      isActive: event.target.value === 'on',
                    })
                  }
                >
                  <option value="on">{t`On`}</option>
                  <option value="off">{t`Paused`}</option>
                </select>
              </label>
            </StyledRow>

            {editing.steps.map((step, index) => (
              <StyledStep key={step.id}>
                <strong>{t`Step ${index + 1}`}</strong>
                <select
                  aria-label={t`Template`}
                  value={step.templateId}
                  onChange={(event) =>
                    updateStep(index, { templateId: event.target.value })
                  }
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <StyledWait>
                  {index === 0 ? t`Send after` : t`Wait`}
                  <input
                    type="number"
                    min={0}
                    aria-label={t`Days`}
                    value={step.delayDays}
                    onChange={(event) =>
                      updateStep(index, {
                        delayDays: Math.max(0, Number(event.target.value)),
                      })
                    }
                  />
                  {t`days`}
                </StyledWait>
                <button
                  type="button"
                  aria-label={t`Remove step`}
                  onClick={() =>
                    setDraft({
                      ...editing,
                      steps: editing.steps.filter(
                        (_, stepIndex) => stepIndex !== index,
                      ),
                    })
                  }
                >
                  <IconTrash size={16} />
                </button>
              </StyledStep>
            ))}

            <StyledRow style={{ justifyContent: 'space-between' }}>
              <StyledRow>
                <StyledButton
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...editing,
                      steps: [
                        ...editing.steps,
                        {
                          id: v4(),
                          templateId: templates[0]?.id ?? '',
                          delayDays: 3,
                        },
                      ],
                    })
                  }
                >
                  <IconPlus size={14} />
                  {t`Add step`}
                </StyledButton>
                <StyledButton
                  type="button"
                  data-tone="danger"
                  onClick={() => void deleteSequence()}
                >
                  {t`Delete`}
                </StyledButton>
              </StyledRow>
              <StyledButton
                type="button"
                data-primary
                disabled={draft === null}
                onClick={() => void saveDraft()}
              >
                {t`Save sequence`}
              </StyledButton>
            </StyledRow>
            <StyledMuted>
              {t`Replies stop the sequence for that person automatically. Add people from the Leads list: select leads, then "Add to sequence".`}
            </StyledMuted>
          </StyledCard>

          <StyledCard>
            <StyledStats>
              <div>
                {t`Active`}
                <strong>{countBy('active')}</strong>
              </div>
              <div>
                {t`Replied`}
                <strong>{countBy('replied')}</strong>
              </div>
              <div>
                {t`Finished`}
                <strong>{countBy('finished')}</strong>
              </div>
              <div>
                {t`Stopped`}
                <strong>{countBy('stopped')}</strong>
              </div>
              <div>
                {t`Failed`}
                <strong>{countBy('failed')}</strong>
              </div>
            </StyledStats>
            {sequenceEnrollments.length === 0 ? (
              <StyledMuted>{t`Nobody is in this sequence yet.`}</StyledMuted>
            ) : (
              sequenceEnrollments.map((enrollment) => (
                <StyledEnrollment key={enrollment.id}>
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        isDefined(enrollment.companyId) &&
                        openRecordInSidePanel({
                          recordId: enrollment.companyId,
                          objectNameSingular: CoreObjectNameSingular.Company,
                        })
                      }
                    >
                      {[enrollment.firstName, enrollment.lastName]
                        .filter(Boolean)
                        .join(' ') || enrollment.email}
                    </button>
                    <small>{enrollment.companyName}</small>
                  </div>
                  <div>
                    {t`Step ${Math.min(enrollment.stepIndex + 1, editing.steps.length)} of ${editing.steps.length}`}
                    <small>
                      {enrollment.status === 'active'
                        ? t`Next: ${formatWhen(enrollment.nextSendAt)}`
                        : (enrollment.lastError ??
                          t`Last sent ${formatWhen(enrollment.lastSentAt)}`)}
                    </small>
                  </div>
                  <StyledStatus
                    style={{
                      background:
                        themeCssVariables.tag.background[
                          STATUS_COLORS[
                            enrollment.status
                          ] as keyof typeof themeCssVariables.tag.background
                        ],
                      color:
                        themeCssVariables.tag.text[
                          STATUS_COLORS[
                            enrollment.status
                          ] as keyof typeof themeCssVariables.tag.text
                        ],
                    }}
                  >
                    {enrollment.status}
                  </StyledStatus>
                  <small>{t`${enrollment.sentCount} sent`}</small>
                  {enrollment.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => void stopEnrollment(enrollment.id)}
                    >
                      {t`Stop`}
                    </button>
                  ) : (
                    <span />
                  )}
                </StyledEnrollment>
              ))
            )}
          </StyledCard>
        </div>
      ) : (
        <StyledCard>
          <StyledMuted>
            {t`Sequences send a series of follow-up emails on a schedule until the person replies.`}
          </StyledMuted>
        </StyledCard>
      )}
    </StyledSplit>
  );
};
