import { PulseLastContact } from '@/pulse-leads/components/PulseLastContact';
import { type PulseLead } from '@/pulse-leads/types/PulseLead';
import { type PulseBoardDeal } from '@/pulse-opportunities/hooks/usePulseBoardDeals';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
import {
  formatContactPhone,
  usePulseContactActions,
} from '@/pulse-record/hooks/usePulseContactActions';
import { formatFullName } from '@/pulse-record/hooks/usePulseAccountData';
import { pulseDealCardSettingsState } from '@/pulse-opportunities/states/pulseDealCardSettingsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { getLogoUrlFromDomainName, isDefined } from 'twenty-shared/utils';
import {
  IconCalendarEvent,
  IconClock,
  IconLink,
  IconUserCircle,
  IconMail,
  IconMessage,
  IconPencil,
  IconPhone,
  IconTrash,
  IconUser,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

export type PulseDealUpdate = {
  pipelineValue: string | null;
  stageFieldName: string;
  stageValue: string;
  amount: number;
  closeDate: string | null;
  name: string;
};

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: grab;
  flex-shrink: 0;
  overflow: hidden;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  user-select: none;

  &:hover {
    border-color: ${themeCssVariables.accent.accent8};
    box-shadow: 0 4px 14px -6px rgba(0, 0, 0, 0.18);
  }

  &[data-editing='true'] {
    cursor: default;
    user-select: auto;
  }
`;

const StyledHead = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledLogo = styled.span`
  align-items: center;
  background: ${themeCssVariables.accent.quaternary};
  border-radius: 6px;
  color: ${themeCssVariables.accent.accent11};
  display: flex;
  flex: none;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: 700;
  height: 22px;
  justify-content: center;
  overflow: hidden;
  width: 22px;
`;

const StyledLogoImage = styled.img`
  border-radius: 6px;
  height: 22px;
  object-fit: cover;
  width: 22px;
`;

const StyledCompany = styled.span`
  color: ${themeCssVariables.accent.accent11};
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 26px;
  justify-content: center;
  width: 26px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledAmount = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: 700;
`;

const StyledRow = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRowText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledNote = styled.p`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: ${themeCssVariables.font.color.tertiary};
  display: -webkit-box;
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.45;
  margin: 0;
  overflow: hidden;
`;

const StyledForm = styled.form`
  background: ${themeCssVariables.accent.quaternary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledField = styled.label`
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 4px;
  min-width: 0;

  input,
  select,
  textarea {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 8px;
    box-sizing: border-box;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    padding: 8px 10px;
    width: 100%;
  }

  textarea {
    min-height: 80px;
    resize: vertical;
  }
`;

const StyledFieldRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledFormActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
`;

const StyledButton = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[data-primary='true'] {
    background: ${themeCssVariables.accent.accent9};
    color: #fff;
  }
`;

const formatRelativeDate = (isoDate: string) => {
  const minutes = Math.round(
    (Date.now() - new Date(isoDate).getTime()) / 60_000,
  );

  if (minutes < 60) {
    return `${Math.max(minutes, 1)}m ago`;
  }

  if (minutes < 60 * 24) {
    return `${Math.round(minutes / 60)}h ago`;
  }

  const days = Math.round(minutes / (60 * 24));

  return days < 30 ? `${days}d ago` : `${Math.round(days / 30)}mo ago`;
};

const formatMoney = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);

type PulseDealCardProps = {
  deal: PulseBoardDeal;
  pipeline: PulsePipeline;
  pipelines: PulsePipeline[];
  onOpen: (deal: PulseBoardDeal) => void;
  onSave: (deal: PulseBoardDeal, update: PulseDealUpdate) => Promise<void>;
  onDelete: (deal: PulseBoardDeal) => void;
  lastContact?: PulseLead;
};

export const PulseDealCard = ({
  deal,
  pipeline,
  pipelines,
  onOpen,
  onSave,
  onDelete,
  lastContact,
}: PulseDealCardProps) => {
  const { t } = useLingui();
  const { call, email, text } = usePulseContactActions();
  const [isEditing, setIsEditing] = useState(false);
  const [hasLogoFailed, setHasLogoFailed] = useState(false);
  const fields = useAtomStateValue(pulseDealCardSettingsState);
  const website = deal.company?.domainName?.primaryLinkUrl ?? '';
  const logoUrl = getLogoUrlFromDomainName(website);
  const ownerName = formatFullName(deal.owner?.name);

  const amount = (deal.amount?.amountMicros ?? 0) / 1_000_000;
  const currencyCode = deal.amount?.currencyCode || 'USD';
  const companyName = deal.company?.name ?? t`No account`;
  const contact = deal.pointOfContact;
  const contactName = formatFullName(contact?.name);
  const phone = formatContactPhone(contact?.phones);
  const currentStage = String(deal[pipeline.stageFieldName] ?? '');
  // The deal name carries "Account · first line of the Close note", so the note is the remainder.
  const accountPrefix = `${deal.company?.name ?? ''} · `;
  const note = (deal.name ?? '').startsWith(accountPrefix)
    ? (deal.name ?? '').slice(accountPrefix.length)
    : (deal.name ?? '');

  const stageKey = (targetPipeline: PulsePipeline, stageValue: string) =>
    `${targetPipeline.viewId}::${stageValue}`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const [viewId, stageValue] = String(form.get('stage')).split('::');
    const targetPipeline =
      pipelines.find((candidate) => candidate.viewId === viewId) ?? pipeline;

    await onSave(deal, {
      pipelineValue: targetPipeline.pipelineValue,
      stageFieldName: targetPipeline.stageFieldName,
      stageValue,
      amount: Number(form.get('amount') ?? 0),
      closeDate: String(form.get('closeDate') ?? '') || null,
      name: String(form.get('name') ?? deal.name ?? ''),
    });
    setIsEditing(false);
  };

  return (
    <StyledCard
      data-editing={isEditing}
      draggable={!isEditing}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', deal.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDoubleClick={() => {
        if (!isEditing) {
          onOpen(deal);
        }
      }}
    >
      <StyledHead>
        <StyledLogo>
          {isDefined(logoUrl) && !hasLogoFailed ? (
            <StyledLogoImage
              src={logoUrl}
              alt=""
              onError={() => setHasLogoFailed(true)}
            />
          ) : (
            companyName.charAt(0).toUpperCase()
          )}
        </StyledLogo>
        <StyledCompany>{companyName}</StyledCompany>
        {!isEditing && (
          <>
            <StyledIconButton
              type="button"
              aria-label={t`Edit deal`}
              onClick={() => setIsEditing(true)}
            >
              <IconPencil size={16} />
            </StyledIconButton>
            <StyledIconButton
              type="button"
              aria-label={t`Delete deal`}
              onClick={() => onDelete(deal)}
            >
              <IconTrash size={16} />
            </StyledIconButton>
          </>
        )}
      </StyledHead>

      {isEditing ? (
        <StyledForm onSubmit={handleSubmit}>
          <StyledField>
            {t`Status`}
            <select
              name="stage"
              defaultValue={stageKey(pipeline, currentStage)}
            >
              {pipelines.map((candidate) => (
                <optgroup key={candidate.viewId} label={candidate.name}>
                  {candidate.stages.map((stage) => (
                    <option
                      key={stage.value}
                      value={stageKey(candidate, stage.value)}
                    >
                      {stage.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </StyledField>
          <StyledFieldRow>
            <StyledField>
              {t`Value`}
              <input
                name="amount"
                type="number"
                min="0"
                step="1"
                defaultValue={amount}
              />
            </StyledField>
            <StyledField>
              {t`Estimated close`}
              <input
                name="closeDate"
                type="date"
                defaultValue={deal.closeDate?.slice(0, 10) ?? ''}
              />
            </StyledField>
          </StyledFieldRow>
          <StyledField>
            {t`Notes`}
            <textarea name="name" defaultValue={deal.name ?? ''} />
          </StyledField>
          <StyledFormActions>
            <StyledButton type="button" onClick={() => setIsEditing(false)}>
              {t`Cancel`}
            </StyledButton>
            <StyledButton type="submit" data-primary>
              {t`Save`}
            </StyledButton>
          </StyledFormActions>
        </StyledForm>
      ) : (
        <StyledBody>
          {fields.value && (
            <StyledAmount>{formatMoney(amount, currencyCode)}</StyledAmount>
          )}
          {fields.contact && isDefined(contact) && (
            <StyledRow>
              <IconUser size={15} />
              <StyledRowText>{contactName || t`Contact`}</StyledRowText>
              <StyledIconButton
                type="button"
                aria-label={t`Email`}
                onClick={() => email(contact.emails?.primaryEmail)}
              >
                <IconMail size={15} />
              </StyledIconButton>
              <StyledIconButton
                type="button"
                aria-label={t`Call`}
                onClick={() =>
                  call(phone, {
                    personId: contact.id,
                    companyId: deal.company?.id,
                  })
                }
              >
                <IconPhone size={15} />
              </StyledIconButton>
              <StyledIconButton
                type="button"
                aria-label={t`Text`}
                onClick={() => text(phone)}
              >
                <IconMessage size={15} />
              </StyledIconButton>
            </StyledRow>
          )}
          {fields.owner && ownerName.length > 0 && (
            <StyledRow>
              <IconUserCircle size={15} />
              <StyledRowText>{ownerName}</StyledRowText>
            </StyledRow>
          )}
          {fields.website && website.length > 0 && (
            <StyledRow>
              <IconLink size={15} />
              <StyledRowText>
                {website.replace(/^https?:\/\//, '')}
              </StyledRowText>
            </StyledRow>
          )}
          {fields.closeDate && isDefined(deal.closeDate) && (
            <StyledRow>
              <IconCalendarEvent size={15} />
              <StyledRowText>
                {new Date(deal.closeDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </StyledRowText>
            </StyledRow>
          )}
          {fields.lastActivity && (
            <StyledRow>
              {isDefined(deal.company) ? (
                <PulseLastContact lead={lastContact} now={Date.now()} />
              ) : (
                <>
                  <IconClock size={15} />
                  <StyledRowText>
                    {t`Updated ${formatRelativeDate(deal.updatedAt)}`}
                  </StyledRowText>
                </>
              )}
            </StyledRow>
          )}
          {fields.note && note.length > 0 && <StyledNote>{note}</StyledNote>}
        </StyledBody>
      )}
    </StyledCard>
  );
};
