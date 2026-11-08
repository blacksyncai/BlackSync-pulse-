import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useSaveSelectOptions } from '@/pulse-customize/hooks/useSaveSelectOptions';
import { usePulseForms } from '@/pulse-forms/hooks/usePulseForms';
import {
  type PulseForm,
  type PulseFormDefinition,
  type PulseFormField,
  type PulseFormSubmission,
} from '@/pulse-forms/types/PulseForm';
import { usePulsePipelines } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { IconFileText } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { v4 } from 'uuid';

const DEFAULT_FIELDS: PulseFormField[] = [
  { key: 'firstName', label: 'First name', required: true },
  { key: 'lastName', label: 'Last name', required: false },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'message', label: 'How can we help?', required: false },
];
const emptyForm = (): PulseFormDefinition => ({
  title: 'Get in touch',
  description: 'Tell us a little about yourself. Our team will follow up.',
  submitLabel: 'Send inquiry',
  successMessage: 'Thank you. Your inquiry has been received.',
  published: false,
  fields: DEFAULT_FIELDS.map((field) => ({ ...field })),
  pondValue: null,
  pipelineViewId: null,
  stageValue: null,
});
const StyledPage = styled.div`
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
  color: ${themeCssVariables.font.color.primary};
  h1 {
    font-size: 28px;
    margin: 0;
    letter-spacing: -0.5px;
  }
  h2 {
    font-size: 18px;
    margin: 0 0 16px;
  }
  p,
  small {
    color: ${themeCssVariables.font.color.secondary};
    line-height: 1.5;
  }
  input:not([type='checkbox']),
  textarea,
  select {
    box-sizing: border-box;
    display: block;
    width: 100%;
    padding: 10px;
    border: 1px solid ${themeCssVariables.border.color.strong};
    border-radius: 8px;
    background: ${themeCssVariables.background.primary};
    color: inherit;
    font: inherit;
    margin-top: 6px;
  }
  label {
    display: block;
    font-size: 13px;
  }
  button,
  a {
    font: inherit;
  }
  a {
    color: ${themeCssVariables.accent.accent11};
    overflow-wrap: anywhere;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: 2px;
  }
  @media (max-width: 640px) {
    padding: 16px;
  }
`;
const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;
const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(190px, 0.65fr) minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  @media (max-width: 1150px) {
    grid-template-columns: minmax(180px, 0.6fr) minmax(0, 1.4fr);
  }
  @media (max-width: 700px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const StyledPanel = styled.section`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 14px;
  padding: 20px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const StyledButton = styled.button`
  border: 1px solid ${themeCssVariables.border.color.strong};
  background: transparent;
  color: inherit;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  &[data-primary='true'] {
    background: ${themeCssVariables.accent.accent9};
    color: white;
    border-color: transparent;
  }
  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.accent.accent9};
  }
  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`;
const StyledRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  > label:first-child {
    flex: 1;
    min-width: 130px;
  }
`;
const StyledPreview = styled.div`
  border: 1px dashed ${themeCssVariables.border.color.strong};
  border-radius: 12px;
  padding: 20px;
  h3 {
    margin-top: 0;
  }
  label {
    margin: 16px 0;
  }
`;

export const PulseFormsPage = () => {
  const { t } = useLingui();
  const api = usePulseForms();
  const { pipelines } = usePulsePipelines();
  const { objectMetadataItem: companyMetadata } = useObjectMetadataItem({
    objectNameSingular: CoreObjectNameSingular.Company,
  });
  const pondField = companyMetadata.fields.find(
    (field) => field.name === 'leadPond',
  );
  const { saveSelectOptions } = useSaveSelectOptions();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const [selected, setSelected] = useState<PulseForm | undefined>();
  const [draft, setDraft] = useState<PulseFormDefinition>(emptyForm);
  const [pondName, setPondName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<PulseFormSubmission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const selectionRequest = useRef(0);
  const pipeline = pipelines.find(
    (pipeline) => pipeline.viewId === draft.pipelineViewId,
  );
  const shareUrl = selected
    ? `${window.location.origin}/webhooks/forms/${selected.id}`
    : '';
  const selectForm = async (form?: PulseForm) => {
    if (busy) return;
    const request = ++selectionRequest.current;
    setSelected(form);
    setDraft(
      form
        ? { ...form, fields: form.fields.map((field) => ({ ...field })) }
        : emptyForm(),
    );
    setMessage('');
    setHistory([]);
    if (!form) {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const rows = await api.submissions(form.id);
      if (request === selectionRequest.current) setHistory(rows);
    } catch {
      if (request === selectionRequest.current)
        setMessage(t`Could not load submission history.`);
    } finally {
      if (request === selectionRequest.current) setHistoryLoading(false);
    }
  };
  const save = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const saved = await api.save(draft, selected);
      if (!saved) throw new Error(t`The form was not saved.`);
      setSelected(saved);
      setDraft(saved);
      setMessage(
        saved.published
          ? t`Form published. The share link is ready.`
          : t`Draft saved. This form is not accepting submissions.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t`Could not save the form.`,
      );
    } finally {
      setBusy(false);
    }
  };
  const addPond = async () => {
    if (busy || !pondName.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const option = {
        id: v4(),
        label: pondName.trim(),
        value: `POND_${v4().replace(/-/g, '').toUpperCase()}`,
        color: 'purple',
        position: pondField?.options?.length ?? 0,
      };
      const options = [
        ...(pondField?.options ?? []).map((option, position) => ({
          ...option,
          position,
        })),
        option,
      ];
      const success = await saveSelectOptions({
        objectMetadataId: companyMetadata.id,
        field: pondField,
        fieldName: 'leadPond',
        label: 'Lead pond',
        icon: 'IconUsersGroup',
        options,
      });
      if (!success)
        throw new Error(t`Could not create the pond. Check your permissions.`);
      setDraft((current) => ({ ...current, pondValue: option.value }));
      setPondName('');
      setMessage(t`Pond created. Save the form to use it.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t`Could not create the pond.`,
      );
    } finally {
      setBusy(false);
    }
  };
  const fieldEdit = (
    key: PulseFormField['key'],
    update: Partial<PulseFormField>,
  ) =>
    setDraft((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.key === key ? { ...field, ...update } : field,
      ),
    }));

  return (
    <PageCardLayout
      header={<PageHeader title={t`Forms & submissions`} Icon={IconFileText} />}
    >
      <StyledPage>
        <StyledHeader>
          <div>
            <h1>{t`Turn interest into your next conversation.`}</h1>
            <p>{t`Build a form, choose where leads land, and share its link.`}</p>
          </div>
          <StyledButton
            disabled={busy}
            onClick={() => {
              void selectForm();
            }}
          >{t`New form`}</StyledButton>
        </StyledHeader>
        {message && <p role="status">{message}</p>}
        <StyledGrid>
          <StyledPanel>
            <h2>{t`Forms you manage`}</h2>
            {api.loading && <p role="status">{t`Loading forms…`}</p>}
            {api.error && (
              <>
                <p role="alert">{t`Could not load forms.`}</p>
                <StyledButton
                  onClick={() => {
                    void api.refetch();
                  }}
                >{t`Try again`}</StyledButton>
              </>
            )}
            {api.forms.map((form) => (
              <StyledButton
                key={form.id}
                disabled={busy}
                aria-pressed={selected?.id === form.id}
                onClick={() => {
                  void selectForm(form);
                }}
              >
                {form.title}
                <br />
                <small>
                  {form.published ? t`Published` : t`Draft / paused`}
                </small>
              </StyledButton>
            ))}
            {!api.loading && !api.error && api.forms.length === 0 && (
              <p>{t`Create your first form to start collecting inquiries.`}</p>
            )}
          </StyledPanel>
          <StyledPanel>
            <h2>{selected ? t`Edit form` : t`Create form`}</h2>
            <label>
              {t`Title`}
              <input
                value={draft.title}
                maxLength={120}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </label>
            <label>
              {t`Introduction`}
              <textarea
                aria-label={t`Introduction`}
                value={draft.description}
                maxLength={1000}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            </label>
            <h2>{t`Fields`}</h2>
            <small>{t`Require an email address or phone number. Phone numbers must include a country code.`}</small>
            {DEFAULT_FIELDS.map((defaultField) => {
              const field = draft.fields.find(
                (field) => field.key === defaultField.key,
              );
              return (
                <StyledRow key={defaultField.key}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(field)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          fields: event.target.checked
                            ? [...draft.fields, { ...defaultField }]
                            : draft.fields.filter(
                                (field) => field.key !== defaultField.key,
                              ),
                        })
                      }
                    />
                    {defaultField.label}
                  </label>
                  {field && (
                    <>
                      <label>
                        {t`Label`}
                        <input
                          aria-label={`${defaultField.label} label`}
                          value={field.label}
                          maxLength={100}
                          onChange={(event) =>
                            fieldEdit(field.key, { label: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            fieldEdit(field.key, {
                              required: event.target.checked,
                            })
                          }
                        />
                        {t`Required`}
                      </label>
                    </>
                  )}
                </StyledRow>
              );
            })}
            <h2>{t`Where submissions land`}</h2>
            <label>
              {t`Lead pond`}
              <select
                aria-label={t`Lead pond`}
                value={draft.pondValue ?? ''}
                onChange={(event) =>
                  setDraft({ ...draft, pondValue: event.target.value || null })
                }
              >
                <option value="">{t`No named pond — unassigned lead`}</option>
                {pondField?.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <StyledRow>
              <label>
                {t`Create a pond`}
                <input
                  value={pondName}
                  maxLength={80}
                  placeholder={t`Website inquiries`}
                  onChange={(event) => setPondName(event.target.value)}
                />
              </label>
              <StyledButton
                disabled={busy || !pondName.trim()}
                onClick={() => {
                  void addPond();
                }}
              >{t`Add pond`}</StyledButton>
            </StyledRow>
            <label>
              {t`Pipeline`}
              <select
                aria-label={t`Pipeline`}
                value={draft.pipelineViewId ?? ''}
                onChange={(event) => {
                  const pipeline = pipelines.find(
                    (pipeline) => pipeline.viewId === event.target.value,
                  );
                  setDraft({
                    ...draft,
                    pipelineViewId: pipeline?.viewId ?? null,
                    stageValue: pipeline?.stages[0]?.value ?? null,
                  });
                }}
              >
                <option value="">{t`Lead only — do not create a deal`}</option>
                {pipelines.map((pipeline) => (
                  <option key={pipeline.viewId} value={pipeline.viewId}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </label>
            {draft.pipelineViewId && (
              <label>
                {t`Starting stage`}
                <select
                  aria-label={t`Starting stage`}
                  value={draft.stageValue ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, stageValue: event.target.value })
                  }
                >
                  {!pipeline && (
                    <option value="">{t`Pipeline unavailable — choose another`}</option>
                  )}
                  {pipeline?.stages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <small>{t`New leads enter unassigned. Returning contacts keep their current owner and pond; each new inquiry can create a deal in the selected stage.`}</small>
            <label>
              {t`Submit button`}
              <input
                value={draft.submitLabel}
                maxLength={60}
                onChange={(event) =>
                  setDraft({ ...draft, submitLabel: event.target.value })
                }
              />
            </label>
            <label>
              {t`Success message`}
              <textarea
                aria-label={t`Success message`}
                value={draft.successMessage}
                maxLength={1000}
                onChange={(event) =>
                  setDraft({ ...draft, successMessage: event.target.value })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(event) =>
                  setDraft({ ...draft, published: event.target.checked })
                }
              />
              {t`Published — accept submissions`}
            </label>
            <StyledButton
              data-primary
              disabled={busy}
              onClick={() => {
                void save();
              }}
            >
              {busy ? t`Saving…` : t`Save form`}
            </StyledButton>
          </StyledPanel>
          <StyledPanel>
            <h2>{t`Preview`}</h2>
            <small>{t`Preview only. Save and open the share link to test a real submission.`}</small>
            <StyledPreview>
              <h3>{draft.title}</h3>
              <p>{draft.description}</p>
              {draft.fields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  {field.required ? ' *' : ''}
                  {field.key === 'message' ? (
                    <textarea disabled rows={3} />
                  ) : (
                    <input disabled />
                  )}
                </label>
              ))}
              <StyledButton disabled data-primary>
                {draft.submitLabel}
              </StyledButton>
            </StyledPreview>
            {selected && (
              <>
                <h2>{t`Share`}</h2>
                {selected.published ? (
                  <>
                    <a href={shareUrl} target="_blank" rel="noreferrer">
                      {t`Open published form`} ↗
                    </a>
                    <label>
                      {t`Share link`}
                      <input
                        readOnly
                        value={shareUrl}
                        onFocus={(event) => event.target.select()}
                      />
                    </label>
                  </>
                ) : (
                  <p>{t`This form is paused. Publish and save it to activate the share link.`}</p>
                )}
                <h2>{t`Latest submissions`}</h2>
                {historyLoading ? (
                  <p>{t`Loading submissions…`}</p>
                ) : history.length === 0 ? (
                  <p>{t`No submissions loaded. Reopen this form to refresh.`}</p>
                ) : (
                  history.map((submission) => (
                    <StyledButton
                      key={submission.noteId}
                      onClick={() =>
                        openRecordInSidePanel({
                          objectNameSingular: CoreObjectNameSingular.Note,
                          recordId: submission.noteId,
                        })
                      }
                    >
                      {new Date(submission.submittedAt).toLocaleString()} ·{' '}
                      {t`Open submission`} ↗
                    </StyledButton>
                  ))
                )}
              </>
            )}
            <Link to="/leads">{t`View leads and ponds`} →</Link>
          </StyledPanel>
        </StyledGrid>
      </StyledPage>
    </PageCardLayout>
  );
};
