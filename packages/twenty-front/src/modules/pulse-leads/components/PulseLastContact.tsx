import { type PulseLead } from '@/pulse-leads/types/PulseLead';
import {
  getLastContactKind,
  type PulseLastContactKind,
} from '@/pulse-leads/utils/getLastContactKind';
import { formatRelativeTime } from '@/pulse-leads/utils/formatRelativeTime';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  IconArrowDown,
  IconMail,
  IconMessage,
  IconNotes,
  IconPhone,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLastContact = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
  min-width: 0;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const KIND_COLORS: Record<PulseLastContactKind, string> = {
  call: '#30a46c',
  'email-sent': '#3e63dd',
  'email-received': '#3e63dd',
  text: '#8e4ec6',
  note: '#d29922',
};

type PulseLastContactProps = {
  lead: Pick<PulseLead, 'lastActivityAt' | 'lastActivityTitle'> | undefined;
  now: number;
  isCompact?: boolean;
};

export const PulseLastContact = ({
  lead,
  now,
  isCompact = false,
}: PulseLastContactProps) => {
  const { t } = useLingui();
  const kind = getLastContactKind(lead?.lastActivityTitle ?? null);
  const when = formatRelativeTime(lead?.lastActivityAt ?? null, now);

  if (kind === null || when === null) {
    return <StyledLastContact>{t`Never contacted`}</StyledLastContact>;
  }

  const labels: Record<PulseLastContactKind, string> = {
    call: t`Call`,
    'email-sent': t`Email sent`,
    'email-received': t`Email received`,
    text: t`Text`,
    note: t`Note`,
  };
  const Icon =
    kind === 'call'
      ? IconPhone
      : kind === 'text'
        ? IconMessage
        : kind === 'note'
          ? IconNotes
          : IconMail;

  return (
    <StyledLastContact title={lead?.lastActivityTitle ?? undefined}>
      <Icon size={14} color={KIND_COLORS[kind]} />
      {kind === 'email-received' && (
        <IconArrowDown size={12} color={KIND_COLORS[kind]} />
      )}
      <span>
        {isCompact ? when : t`Last contacted ${when} · ${labels[kind]}`}
      </span>
    </StyledLastContact>
  );
};
