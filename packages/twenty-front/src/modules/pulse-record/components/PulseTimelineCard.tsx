import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  IconArrowDown,
  IconArrowUpRight,
  IconCheckbox,
  IconClock,
  IconMail,
  IconMessage,
  IconNotes,
  IconPhone,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const COLLAPSED_LENGTH = 280;

const KIND_STYLES: Record<
  PulseTimelineItem['kind'],
  { background: string; color: string }
> = {
  call: { background: 'rgba(48, 164, 108, 0.16)', color: '#30a46c' },
  email: { background: 'rgba(62, 99, 221, 0.16)', color: '#3e63dd' },
  sms: { background: 'rgba(142, 78, 198, 0.16)', color: '#8e4ec6' },
  note: { background: 'rgba(245, 166, 35, 0.18)', color: '#d29922' },
  task: { background: 'rgba(120, 120, 140, 0.16)', color: '#8b8d98' },
};

const StyledRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  position: relative;

  &::before {
    background: ${themeCssVariables.border.color.light};
    bottom: -16px;
    content: '';
    left: 17px;
    position: absolute;
    top: 40px;
    width: 1px;
  }

  &:last-child::before {
    display: none;
  }
`;

const StyledBadge = styled.div`
  align-items: center;
  border-radius: 50%;
  display: flex;
  flex: none;
  height: 36px;
  justify-content: center;
  width: 36px;
`;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const StyledCardHeader = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  text-align: left;
  width: 100%;

  &[data-kind='note'] {
    background: rgba(245, 166, 35, 0.08);
  }
`;

const StyledTitle = styled.span`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &[data-done='true'] {
    color: ${themeCssVariables.font.color.tertiary};
    text-decoration: line-through;
  }
`;

const StyledMeta = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: inline-flex;
  flex: none;
  font-size: ${themeCssVariables.font.size.sm};
  gap: 4px;
`;

const StyledOutcome = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: 6px;
  color: ${themeCssVariables.font.color.secondary};
  flex: none;
  font-size: ${themeCssVariables.font.size.xs};
  padding: 2px 6px;
`;

const StyledDate = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex: none;
  font-size: ${themeCssVariables.font.size.sm};
  margin-left: auto;
`;

const StyledBody = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.secondary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.5;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledAudio = styled.audio`
  height: 36px;
  width: 100%;
`;

const StyledLink = styled.a`
  color: ${themeCssVariables.accent.accent10};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledShowMore = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.accent.accent10};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  padding: 0;
`;

const KIND_ICONS = {
  call: IconPhone,
  email: IconMail,
  sms: IconMessage,
  note: IconNotes,
  task: IconCheckbox,
};

const cleanMarkdown = (markdown: string) =>
  markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim();

const formatDate = (date: Date) => {
  const isThisYear = date.getFullYear() === new Date().getFullYear();

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
  });
};

type PulseTimelineCardProps = {
  item: PulseTimelineItem;
  onOpen: (item: PulseTimelineItem) => void;
};

export const PulseTimelineCard = ({ item, onOpen }: PulseTimelineCardProps) => {
  const { t } = useLingui();
  const [isExpanded, setIsExpanded] = useState(false);
  const [canPlayRecording, setCanPlayRecording] = useState(true);
  const Icon = KIND_ICONS[item.kind];
  const body = cleanMarkdown(item.body);
  const isLong = body.length > COLLAPSED_LENGTH;
  const visibleBody =
    isLong && !isExpanded ? `${body.slice(0, COLLAPSED_LENGTH)}…` : body;
  const DirectionIcon =
    item.direction === 'inbound' ? IconArrowDown : IconArrowUpRight;

  return (
    <StyledRow>
      <StyledBadge style={KIND_STYLES[item.kind]}>
        <Icon size={18} />
      </StyledBadge>
      <StyledCard>
        <StyledCardHeader
          type="button"
          data-kind={item.kind}
          onClick={() => onOpen(item)}
        >
          <StyledTitle data-done={item.isDone}>{item.title}</StyledTitle>
          {isDefined(item.direction) && (
            <StyledMeta>
              <DirectionIcon
                size={14}
                color={item.direction === 'inbound' ? '#30a46c' : '#3e63dd'}
              />
            </StyledMeta>
          )}
          {isDefined(item.duration) && (
            <StyledMeta>
              <IconClock size={14} />
              {item.duration}
            </StyledMeta>
          )}
          {isDefined(item.outcome) && (
            <StyledOutcome>{item.outcome}</StyledOutcome>
          )}
          <StyledDate>{formatDate(item.date)}</StyledDate>
        </StyledCardHeader>
        {(body.length > 0 || isDefined(item.recordingUrl)) && (
          <StyledBody>
            {isDefined(item.recordingUrl) &&
              (canPlayRecording ? (
                <StyledAudio
                  controls
                  preload="none"
                  src={item.recordingUrl}
                  onError={() => setCanPlayRecording(false)}
                />
              ) : (
                <StyledLink
                  href={item.recordingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t`Open recording`}
                </StyledLink>
              ))}
            {body.length > 0 && <span>{visibleBody}</span>}
            {isLong && (
              <StyledShowMore
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? t`Show less` : t`Show more...`}
              </StyledShowMore>
            )}
          </StyledBody>
        )}
      </StyledCard>
    </StyledRow>
  );
};
