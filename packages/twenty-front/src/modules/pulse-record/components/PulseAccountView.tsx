import { PulseLeadAssignment } from '@/pulse-assignment/components/PulseLeadAssignment';
import { CrmGlassSurface } from '@/components/ui/crm-glass-surface';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { PulseCustomFieldsSection } from '@/pulse-customize/components/PulseCustomFieldsSection';
import {
  PulseEmailComposer,
  type PulseEmailRecipient,
} from '@/pulse-outreach/components/PulseEmailComposer';
import { PulseNoteComposer } from '@/pulse-record/components/PulseNoteComposer';
import { PulseTimelineCard } from '@/pulse-record/components/PulseTimelineCard';
import {
  formatContactPhone,
  usePulseContactActions,
} from '@/pulse-record/hooks/usePulseContactActions';
import {
  formatFullName,
  type PulseContact,
  usePulseAccountData,
} from '@/pulse-record/hooks/usePulseAccountData';
import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';
import { PulseTaskQuickAdd } from '@/pulse-tasks/components/PulseTaskQuickAdd';
import { SidePanelPageTitleSyncEffect } from '@/side-panel/components/SidePanelPageTitleSyncEffect';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import {
  IconCalendarEvent,
  IconCheckbox,
  IconLink,
  IconMail,
  IconMap,
  IconMessage,
  IconNotes,
  IconPhone,
  IconPlus,
  IconSearch,
  IconSquare,
  IconTargetArrow,
  IconUser,
} from 'twenty-ui/icon';
import { Tag, type TagColor } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

type TimelineFilter = 'all' | 'conversations' | 'notes' | 'tasks';
type LeftTab = 'details' | 'files';
type Composer = 'note' | 'task' | 'email' | null;

const FILTER_KINDS: Record<TimelineFilter, PulseTimelineItem['kind'][]> = {
  all: ['call', 'email', 'sms', 'note', 'task'],
  conversations: ['call', 'email', 'sms'],
  notes: ['note'],
  tasks: ['task'],
};

const StyledRoot = styled.div`
  container-name: pulse-account;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  background: ${themeCssVariables.background.secondary};
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

const StyledHeader = styled.header`
  flex-shrink: 0;
  min-width: 0;
  align-items: center;
  background: linear-gradient(
    115deg,
    ${themeCssVariables.accent.quaternary},
    ${themeCssVariables.background.primary} 65%
  );
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[6]};
`;

const StyledLogo = styled.div`
  align-items: center;
  background: linear-gradient(
    135deg,
    ${themeCssVariables.accent.accent9},
    ${themeCssVariables.accent.accent11}
  );
  border-radius: 12px;
  color: #fff;
  display: flex;
  flex: none;
  font-size: 22px;
  font-weight: 700;
  height: 48px;
  justify-content: center;
  width: 48px;
`;

const StyledIdentity = styled.div`
  flex: 1 1 220px;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
`;

const StyledName = styled.h1`
  color: ${themeCssVariables.font.color.primary};
  font-size: clamp(20px, 2.1vw, 26px);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.25;
  overflow-wrap: anywhere;
`;

const StyledStatusSelect = styled.select`
  align-self: flex-start;
  appearance: none;
  background: ${themeCssVariables.background.transparent.light};
  border: 0;
  border-radius: 999px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 4px 12px;
`;

const StyledActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-left: 0;
`;

const StyledActionButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[2]};
  height: 36px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:hover {
    border-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }

  &[aria-pressed='true'] {
    border-color: ${themeCssVariables.accent.accent9};
    color: ${themeCssVariables.accent.accent11};
  }

  &[data-primary='true'] {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
    color: #fff;
  }
`;

const StyledMobileTabs = styled.div`
  display: none;
  flex-shrink: 0;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  background: ${themeCssVariables.background.primary};
  @container pulse-account (max-width: 760px) {
    display: flex;
  }
`;

const StyledColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  @container pulse-account (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
    &[data-mobile-pane='details'] > [data-account-activity] {
      display: none;
    }
    &[data-mobile-pane='activity'] > [data-account-details] {
      display: none;
    }
  }
`;

const StyledLeft = styled.aside`
  border-right: 1px solid ${themeCssVariables.border.color.medium};
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  height: 100%;
`;

const StyledTabs = styled.div`
  flex-shrink: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  padding: 0 ${themeCssVariables.spacing[4]};
`;

const StyledTab = styled.button`
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[3]} 0;

  &[aria-pressed='true'] {
    border-bottom-color: ${themeCssVariables.font.color.primary};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledLeftScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledSection = styled(CrmGlassSurface)`
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden;
`;

const StyledSectionTitle = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.transparent.lighter};
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
  letter-spacing: 0.04em;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-transform: uppercase;
`;

const StyledSectionAction = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  height: 20px;
  justify-content: center;
  margin-left: auto;
  width: 20px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.accent.accent10};
  }
`;

const StyledCount = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: 6px;
  font-size: ${themeCssVariables.font.size.xs};
  padding: 0 6px;
`;

const StyledLine = styled.div`
  min-width: 0;
  line-height: 1.5;
  > svg {
    flex-shrink: 0;
  }
  align-items: flex-start;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  & + & {
    border-top: 1px solid ${themeCssVariables.border.color.light};
  }

  a {
    color: ${themeCssVariables.accent.accent10};
    text-decoration: none;
  }
`;

const StyledLineText = styled.div`
  overflow-wrap: anywhere;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledDealAmount = styled.span`
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: 700;
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  width: 28px;

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.accent.accent10};
  }
`;

const StyledRight = styled.main`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`;

const StyledFeedBar = styled.div`
  flex-shrink: 0;
  min-width: 0;
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[6]};
`;

const StyledFilter = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: 6px 12px;

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledSearch = styled.label`
  align-items: center;
  background: ${themeCssVariables.background.transparent.light};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1 1 220px;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  padding: 0 ${themeCssVariables.spacing[3]};

  input {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.font.color.primary};
    flex: 1;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 36px;
    min-width: 0;
    width: 100%;
    outline: none;
  }
`;

const StyledFeed = styled.div`
  min-height: 0;
  min-width: 0;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  > * {
    flex-shrink: 0;
  }
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[5]} ${themeCssVariables.spacing[6]};
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[10]};
  text-align: center;
`;

const formatMoney = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);

const formatPhone = (contact: PulseContact) =>
  formatContactPhone(contact.phones);

type PulseAccountViewProps = {
  companyId: string;
};

export const PulseAccountView = ({ companyId }: PulseAccountViewProps) => {
  const { t } = useLingui();
  const {
    account,
    contacts,
    deals,
    timeline,
    attachments,
    leadStatus,
    refetchActivity,
  } = usePulseAccountData(companyId);
  const { updateOneRecord } = useUpdateOneRecord();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const [leftTab, setLeftTab] = useState<LeftTab>('details');
  const [mobilePane, setMobilePane] = useState<'details' | 'activity'>(
    'details',
  );
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState<Composer>(null);

  const accountName = account?.name ?? '';
  const primaryContact = contacts[0];
  const primaryPhone = contacts.map(formatPhone).find(isDefined);
  const openTasks = timeline.filter(
    (item) => item.kind === 'task' && !item.isDone,
  );

  const query = search.trim().toLowerCase();
  const visibleItems = timeline.filter(
    (item) =>
      FILTER_KINDS[filter].includes(item.kind) &&
      (query.length === 0 ||
        `${item.title} ${item.body}`.toLowerCase().includes(query)),
  );

  const { call: handleCall, text: handleSms } = usePulseContactActions();
  const [emailPersonId, setEmailPersonId] = useState<string | null>(null);
  const emailRecipients: PulseEmailRecipient[] = contacts
    .filter((contact) => isDefined(contact.emails?.primaryEmail))
    .map((contact) => ({
      personId: contact.id,
      email: contact.emails?.primaryEmail ?? '',
      firstName: contact.name?.firstName ?? '',
      lastName: contact.name?.lastName ?? '',
    }))
    .filter((recipient) => recipient.email.length > 0)
    .sort(
      (left, right) =>
        Number(right.personId === emailPersonId) -
        Number(left.personId === emailPersonId),
    );

  const openEmail = (personId: string | null) => {
    setEmailPersonId(personId);
    setComposer('email');
    setFilter('all');
    setMobilePane('activity');
  };

  const handleMeeting = () => {
    const guests = contacts
      .map((contact) => contact.emails?.primaryEmail)
      .filter((email): email is string => isDefined(email) && email.length > 0);
    const url = new URL('https://calendar.google.com/calendar/render');

    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `${accountName} <> BlackSync`);
    url.searchParams.set('add', guests.join(','));
    window.open(url.toString(), '_blank');
  };

  const openComposer = (nextComposer: Composer) => {
    setComposer(composer === nextComposer ? null : nextComposer);
    setFilter('all');
    setMobilePane('activity');
  };

  const handleComposerDone = () => {
    setComposer(null);
    void refetchActivity();
  };

  const completeTask = async (taskId: string) => {
    await updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Task,
      idToUpdate: taskId,
      updateOneRecordInput: { status: 'DONE' },
    });
    void refetchActivity();
  };

  const handleLeadStatusChange = (value: string) => {
    if (!isDefined(leadStatus)) {
      return;
    }

    void updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Company,
      idToUpdate: companyId,
      updateOneRecordInput: { [leadStatus.fieldName]: value || null },
    });
  };

  const handleOpenItem = (item: PulseTimelineItem) => {
    if (item.openObjectNameSingular === CoreObjectNameSingular.Message) {
      return;
    }

    openRecordInSidePanel({
      recordId: item.openRecordId,
      objectNameSingular: item.openObjectNameSingular,
    });
  };

  const address = [
    account?.address?.addressStreet1,
    account?.address?.addressCity,
    account?.address?.addressState,
    account?.address?.addressCountry,
  ]
    .filter((part) => isDefined(part) && part.length > 0)
    .join(', ');
  const website = account?.domainName?.primaryLinkUrl;

  const filters: { id: TimelineFilter; label: string }[] = [
    { id: 'all', label: t`All` },
    { id: 'conversations', label: t`Conversations` },
    { id: 'notes', label: t`Notes` },
    { id: 'tasks', label: t`Tasks` },
  ];

  return (
    <StyledRoot data-account-view>
      <SidePanelPageTitleSyncEffect
        pageTitle={accountName.length > 0 ? accountName : undefined}
      />
      <StyledHeader>
        <StyledLogo>{accountName.charAt(0).toUpperCase() || '·'}</StyledLogo>
        <StyledIdentity>
          <StyledName>{accountName}</StyledName>
          {isDefined(leadStatus) && (
            <StyledStatusSelect
              aria-label={t`Lead status`}
              value={leadStatus.value ?? ''}
              onChange={(event) => handleLeadStatusChange(event.target.value)}
            >
              <option value="">{t`No status`}</option>
              {leadStatus.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </StyledStatusSelect>
          )}
        </StyledIdentity>
        <StyledActions>
          <StyledActionButton type="button" onClick={handleMeeting}>
            <IconCalendarEvent size={16} />
            {t`Meeting`}
          </StyledActionButton>
          <StyledActionButton
            type="button"
            aria-pressed={composer === 'note'}
            onClick={() => openComposer('note')}
          >
            <IconNotes size={16} />
            {t`Note`}
          </StyledActionButton>
          <StyledActionButton
            type="button"
            aria-pressed={composer === 'task'}
            onClick={() => openComposer('task')}
          >
            <IconCheckbox size={16} />
            {t`Task`}
          </StyledActionButton>
          <StyledActionButton
            type="button"
            aria-pressed={composer === 'email'}
            onClick={() => openEmail(null)}
          >
            <IconMail size={16} />
            {t`Email`}
          </StyledActionButton>
          <StyledActionButton
            type="button"
            onClick={() => handleSms(primaryPhone)}
          >
            <IconMessage size={16} />
            {t`SMS`}
          </StyledActionButton>
          <StyledActionButton
            type="button"
            data-primary
            onClick={() =>
              handleCall(primaryPhone, {
                personId: contacts.find(
                  (contact) => formatPhone(contact) === primaryPhone,
                )?.id,
                companyId,
              })
            }
          >
            <IconPhone size={16} />
            {primaryContact
              ? t`Call ${formatFullName(primaryContact.name).split(' ')[0] ?? ''}`
              : t`Call`}
          </StyledActionButton>
        </StyledActions>
      </StyledHeader>

      <StyledMobileTabs aria-label={t`Record sections`}>
        <StyledFilter
          type="button"
          aria-pressed={mobilePane === 'details'}
          onClick={() => setMobilePane('details')}
        >{t`Record details`}</StyledFilter>
        <StyledFilter
          type="button"
          aria-pressed={mobilePane === 'activity'}
          onClick={() => setMobilePane('activity')}
        >{t`Activity`}</StyledFilter>
      </StyledMobileTabs>
      <StyledColumns data-mobile-pane={mobilePane}>
        <StyledLeft data-account-details>
          <StyledTabs>
            <StyledTab
              type="button"
              aria-pressed={leftTab === 'details'}
              onClick={() => setLeftTab('details')}
            >
              {t`Details`}
            </StyledTab>
            <StyledTab
              type="button"
              aria-pressed={leftTab === 'files'}
              onClick={() => setLeftTab('files')}
            >
              {t`Files`} <StyledCount>{attachments.length}</StyledCount>
            </StyledTab>
          </StyledTabs>
          <StyledLeftScroll
            role="region"
            aria-label={t`Record details and contacts`}
            tabIndex={0}
          >
            {leftTab === 'details' ? (
              <>
                <StyledSection>
                  <StyledSectionTitle>{t`Assigned to`}</StyledSectionTitle>
                  <StyledLine>
                    <PulseLeadAssignment companyId={companyId} />
                  </StyledLine>
                </StyledSection>
                <StyledSection>
                  <StyledSectionTitle>{t`About`}</StyledSectionTitle>
                  <StyledLine>
                    <IconMap size={16} />
                    <StyledLineText>
                      {address.length > 0 ? (
                        address
                      ) : (
                        <StyledMuted>{t`No address`}</StyledMuted>
                      )}
                    </StyledLineText>
                  </StyledLine>
                  <StyledLine>
                    <IconLink size={16} />
                    <StyledLineText>
                      {isDefined(website) && website.length > 0 ? (
                        <a
                          href={
                            website.startsWith('http')
                              ? website
                              : `https://${website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <StyledMuted>{t`No website`}</StyledMuted>
                      )}
                    </StyledLineText>
                  </StyledLine>
                  <PulseCustomFieldsSection
                    objectNameSingular={CoreObjectNameSingular.Company}
                    recordId={companyId}
                  />
                </StyledSection>

                <StyledSection>
                  <StyledSectionTitle>
                    <IconCheckbox size={14} />
                    {t`Tasks`} <StyledCount>{openTasks.length}</StyledCount>
                    <StyledSectionAction
                      type="button"
                      aria-label={t`New task`}
                      onClick={() => openComposer('task')}
                    >
                      <IconPlus size={14} />
                    </StyledSectionAction>
                  </StyledSectionTitle>
                  {openTasks.length === 0 ? (
                    <StyledLine>
                      <StyledMuted>{t`No open tasks`}</StyledMuted>
                    </StyledLine>
                  ) : (
                    openTasks.map((task) => (
                      <StyledLine key={task.id}>
                        <StyledIconButton
                          type="button"
                          aria-label={t`Mark as done`}
                          onClick={() => void completeTask(task.id)}
                        >
                          <IconSquare size={16} />
                        </StyledIconButton>
                        <StyledLineText>
                          {task.title}
                          <StyledMuted>
                            {task.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </StyledMuted>
                        </StyledLineText>
                      </StyledLine>
                    ))
                  )}
                </StyledSection>

                <StyledSection>
                  <StyledSectionTitle>
                    <IconTargetArrow size={14} />
                    {t`Opportunities`} <StyledCount>{deals.length}</StyledCount>
                  </StyledSectionTitle>
                  {deals.length === 0 ? (
                    <StyledLine>
                      <StyledMuted>{t`No deals yet`}</StyledMuted>
                    </StyledLine>
                  ) : (
                    deals.map((deal) => (
                      <StyledLine key={deal.id}>
                        <StyledLineText>
                          <StyledDealAmount>
                            {formatMoney(deal.amount, deal.currencyCode)}
                          </StyledDealAmount>
                          <StyledMuted>{deal.name}</StyledMuted>
                          <div>
                            {isDefined(deal.pipelineLabel) && (
                              <Tag color="gray">{deal.pipelineLabel}</Tag>
                            )}{' '}
                            {isDefined(deal.stageLabel) && (
                              <Tag color={deal.stageColor as TagColor}>
                                {deal.stageLabel}
                              </Tag>
                            )}
                          </div>
                        </StyledLineText>
                      </StyledLine>
                    ))
                  )}
                </StyledSection>

                <StyledSection>
                  <StyledSectionTitle>
                    <IconUser size={14} />
                    {t`Contacts`} <StyledCount>{contacts.length}</StyledCount>
                  </StyledSectionTitle>
                  {contacts.length === 0 ? (
                    <StyledLine>
                      <StyledMuted>{t`No contacts yet`}</StyledMuted>
                    </StyledLine>
                  ) : (
                    contacts.map((contact) => {
                      const phone = formatPhone(contact);

                      return (
                        <StyledLine key={contact.id}>
                          <StyledLineText>
                            {formatFullName(contact.name) || t`Unnamed`}
                            {isDefined(contact.jobTitle) &&
                              contact.jobTitle.length > 0 && (
                                <StyledMuted>{contact.jobTitle}</StyledMuted>
                              )}
                          </StyledLineText>
                          <StyledIconButton
                            type="button"
                            aria-label={t`Email`}
                            onClick={() => openEmail(contact.id)}
                          >
                            <IconMail size={16} />
                          </StyledIconButton>
                          <StyledIconButton
                            type="button"
                            aria-label={t`Text`}
                            onClick={() => handleSms(phone)}
                          >
                            <IconMessage size={16} />
                          </StyledIconButton>
                          <StyledIconButton
                            type="button"
                            aria-label={t`Call`}
                            onClick={() =>
                              handleCall(phone, {
                                personId: contact.id,
                                companyId,
                              })
                            }
                          >
                            <IconPhone size={16} />
                          </StyledIconButton>
                        </StyledLine>
                      );
                    })
                  )}
                </StyledSection>
              </>
            ) : (
              <StyledSection>
                {attachments.length === 0 ? (
                  <StyledLine>
                    <StyledMuted>{t`No files yet`}</StyledMuted>
                  </StyledLine>
                ) : (
                  attachments.map((attachment) => {
                    const file = attachment.file?.[0];

                    return (
                      <StyledLine key={attachment.id}>
                        <StyledLineText>
                          {isDefined(file?.url) ? (
                            <a href={file.url} target="_blank" rel="noreferrer">
                              {attachment.name ?? file.label}
                            </a>
                          ) : (
                            (attachment.name ?? t`File`)
                          )}
                          <StyledMuted>
                            {(file?.extension ?? '').toUpperCase()}
                          </StyledMuted>
                        </StyledLineText>
                      </StyledLine>
                    );
                  })
                )}
              </StyledSection>
            )}
          </StyledLeftScroll>
        </StyledLeft>

        <StyledRight data-account-activity>
          <StyledFeedBar>
            {filters.map((option) => (
              <StyledFilter
                key={option.id}
                type="button"
                aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
              >
                {option.label}
              </StyledFilter>
            ))}
            <StyledSearch>
              <IconSearch size={16} />
              <input
                value={search}
                placeholder={t`Search activity`}
                onChange={(event) => setSearch(event.target.value)}
              />
            </StyledSearch>
          </StyledFeedBar>
          <StyledFeed
            role="region"
            aria-label={t`Activity timeline`}
            tabIndex={0}
          >
            {composer === 'note' && (
              <PulseNoteComposer
                companyId={companyId}
                onDone={handleComposerDone}
              />
            )}
            {composer === 'email' && (
              <PulseEmailComposer
                key={emailPersonId ?? 'primary'}
                recipients={emailRecipients}
                companyName={accountName}
                onDone={handleComposerDone}
              />
            )}
            {composer === 'task' && (
              <PulseTaskQuickAdd
                autoFocus
                companyId={companyId}
                onCreated={handleComposerDone}
              />
            )}
            {visibleItems.length === 0 ? (
              <StyledEmpty>{t`Nothing here yet.`}</StyledEmpty>
            ) : (
              visibleItems.map((item) => (
                <PulseTimelineCard
                  key={item.id}
                  item={item}
                  onOpen={handleOpenItem}
                />
              ))
            )}
          </StyledFeed>
        </StyledRight>
      </StyledColumns>
    </StyledRoot>
  );
};
