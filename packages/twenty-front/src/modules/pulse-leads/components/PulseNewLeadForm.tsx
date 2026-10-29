import { type LeadStatusOption } from '@/pulse-leads/hooks/useLeadStatusOptions';
import {
  type PulseNewLead,
  usePulseLeadActions,
} from '@/pulse-leads/hooks/usePulseLeadActions';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledForm = styled.form`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.accent.accent9};
  border-radius: 14px;
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  padding: ${themeCssVariables.spacing[4]};

  input,
  select {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 34px;
    padding: 0 ${themeCssVariables.spacing[2]};
  }
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  grid-column: 1 / -1;
  justify-content: flex-end;

  button {
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 34px;
    padding: 0 ${themeCssVariables.spacing[4]};
  }

  button[type='button'] {
    background: transparent;
    border: 1px solid ${themeCssVariables.border.color.medium};
    color: ${themeCssVariables.font.color.secondary};
  }

  button[type='submit'] {
    background: ${themeCssVariables.accent.accent9};
    border: 0;
    color: #fff;
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const EMPTY_LEAD: PulseNewLead = {
  name: '',
  website: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  leadStatus: null,
};

type PulseNewLeadFormProps = {
  statusOptions: LeadStatusOption[];
  onCreated: (leadId: string) => void;
  onCancel: () => void;
};

export const PulseNewLeadForm = ({
  statusOptions,
  onCreated,
  onCancel,
}: PulseNewLeadFormProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { createLead } = usePulseLeadActions();
  const [lead, setLead] = useState<PulseNewLead>(EMPTY_LEAD);
  const [isSaving, setIsSaving] = useState(false);

  const field = (key: keyof PulseNewLead) => ({
    value: lead[key] ?? '',
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => setLead({ ...lead, [key]: event.target.value || null }),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (lead.name.trim().length === 0 || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const company = await createLead({
        ...lead,
        name: lead.name ?? '',
        website: lead.website ?? '',
        firstName: lead.firstName ?? '',
        lastName: lead.lastName ?? '',
        email: lead.email ?? '',
        phone: lead.phone ?? '',
      });

      setLead(EMPTY_LEAD);
      onCreated(company.id);
    } catch {
      enqueueToast({
        variant: 'error',
        children: t`Could not create the lead.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit}>
      <input
        autoFocus
        required
        aria-label={t`Company`}
        placeholder={t`Company name *`}
        {...field('name')}
      />
      <input
        aria-label={t`Website`}
        placeholder={t`Website`}
        {...field('website')}
      />
      <input
        aria-label={t`First name`}
        placeholder={t`Contact first name`}
        {...field('firstName')}
      />
      <input
        aria-label={t`Last name`}
        placeholder={t`Contact last name`}
        {...field('lastName')}
      />
      <input
        type="email"
        aria-label={t`Email`}
        placeholder={t`Email`}
        {...field('email')}
      />
      <input
        type="tel"
        aria-label={t`Phone`}
        placeholder={t`Phone`}
        {...field('phone')}
      />
      {statusOptions.length > 0 && (
        <select aria-label={t`Status`} {...field('leadStatus')}>
          <option value="">{t`No status`}</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
      <StyledActions>
        <button type="button" onClick={onCancel}>
          {t`Cancel`}
        </button>
        <button type="submit" disabled={isSaving}>
          {isSaving ? t`Saving...` : t`Create lead`}
        </button>
      </StyledActions>
    </StyledForm>
  );
};
