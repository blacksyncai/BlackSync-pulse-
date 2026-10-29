import { PULSE_TRANSCRIBE_CALL } from '@/pulse-record/graphql/pulseTranscribeCall';
import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';
import {
  parsePulseCallBody,
  type PulseTranscriptLine,
} from '@/pulse-record/utils/parsePulseCallBody';
import { useApolloClient } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { themeCssVariables } from 'twenty-ui/theme';

type CallTab = 'summary' | 'transcript' | 'details';

const StyledBody = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledTabs = styled.div`
  display: flex;
  gap: 2px;
`;

const StyledTab = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: 4px 10px;

  small {
    color: ${themeCssVariables.font.color.light};
    margin-left: 4px;
  }

  &[aria-selected='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledText = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledAudio = styled.audio`
  height: 36px;
  width: 100%;
`;

const StyledFacts = styled.dl`
  display: grid;
  gap: 6px ${themeCssVariables.spacing[4]};
  grid-template-columns: minmax(110px, max-content) 1fr;
  margin: 0;

  dt {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.sm};
  }

  dd {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.md};
    margin: 0;
    word-break: break-word;
  }
`;

const StyledHighlights = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    background: ${themeCssVariables.background.transparent.light};
    border-radius: 999px;
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
    padding: 3px 10px;
  }

  strong {
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledTranscript = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
`;

const StyledBubble = styled.div`
  align-self: flex-start;
  background: ${themeCssVariables.background.transparent.light};
  border-radius: 12px 12px 12px 4px;
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.45;
  max-width: 85%;
  padding: 8px 12px;

  small {
    color: ${themeCssVariables.font.color.tertiary};
    display: block;
    font-size: ${themeCssVariables.font.size.xs};
    font-weight: ${themeCssVariables.font.weight.semiBold};
    margin-bottom: 2px;
  }

  &[data-side='right'] {
    align-self: flex-end;
    background: ${themeCssVariables.accent.quaternary};
    border-radius: 12px 12px 4px 12px;
  }
`;

const StyledLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};

  a,
  button {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.accent.accent10};
    cursor: pointer;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.sm};
    padding: 0;
    text-decoration: none;
  }
`;

const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

// Short answers that matter most on an AI-agent call are pulled up as chips.
const HIGHLIGHT_LABELS = [
  'interest level',
  'next step',
  'next action',
  'timeline',
  'key objections',
];

const cleanMarkdown = (markdown: string) =>
  markdown.replace(/\*\*(.*?)\*\*/g, '$1').trim();

const sideFor = (speakers: string[], speaker: string | null) =>
  speaker !== null && speakers.indexOf(speaker) % 2 === 1 ? 'right' : 'left';

type PulseCallCardBodyProps = {
  item: PulseTimelineItem;
};

export const PulseCallCardBody = ({ item }: PulseCallCardBodyProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const apolloClient = useApolloClient();
  const parsed = parsePulseCallBody(item.body);
  const [transcript, setTranscript] = useState<PulseTranscriptLine[] | null>(
    null,
  );
  const lines = transcript ?? parsed.transcript;
  const [tab, setTab] = useState<CallTab>('summary');
  const [canPlayRecording, setCanPlayRecording] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const speakers = [
    ...new Set(lines.map((line) => line.speaker).filter(isDefined)),
  ];
  const highlights = parsed.facts.filter((fact) =>
    HIGHLIGHT_LABELS.includes(fact.label.toLowerCase()),
  );
  const summary = cleanMarkdown(parsed.summary);

  const transcribe = async () => {
    if (!isDefined(item.recordingUrl)) {
      return;
    }

    setIsTranscribing(true);

    try {
      const { data } = await apolloClient.mutate<{
        pulseTranscribeCall: string | null;
      }>({
        mutation: PULSE_TRANSCRIBE_CALL,
        variables: {
          noteId: item.openRecordId,
          recordingUrl: item.recordingUrl,
        },
      });
      const text = data?.pulseTranscribeCall;

      if (isDefined(text)) {
        setTranscript(
          parsePulseCallBody(`**Transcript**\n\n${text}`).transcript,
        );
      } else {
        enqueueToast({
          variant: 'info',
          children: t`No speech was found in this recording.`,
        });
      }
    } catch (error) {
      enqueueToast({
        variant: 'error',
        children:
          error instanceof Error ? error.message : t`Could not transcribe.`,
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const tabs: { id: CallTab; label: string; count?: number }[] = [
    { id: 'summary', label: t`Summary` },
    { id: 'transcript', label: t`Transcript`, count: lines.length },
    { id: 'details', label: t`Details`, count: parsed.facts.length },
  ];

  return (
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
          <StyledLinks>
            <a href={item.recordingUrl} target="_blank" rel="noreferrer">
              {t`Open recording`}
            </a>
          </StyledLinks>
        ))}

      <StyledTabs role="tablist">
        {tabs.map((option) => (
          <StyledTab
            key={option.id}
            type="button"
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
          >
            {option.label}
            {isDefined(option.count) && option.count > 0 && (
              <small>{option.count}</small>
            )}
          </StyledTab>
        ))}
      </StyledTabs>

      {tab === 'summary' && (
        <>
          {highlights.length > 0 && (
            <StyledHighlights>
              {highlights.map((fact) => (
                <span key={fact.label}>
                  {fact.label}: <strong>{fact.value}</strong>
                </span>
              ))}
            </StyledHighlights>
          )}
          {summary.length > 0 ? (
            <StyledText>{summary}</StyledText>
          ) : (
            <StyledMuted>{t`No summary for this call.`}</StyledMuted>
          )}
        </>
      )}

      {tab === 'transcript' &&
        (lines.length > 0 ? (
          <StyledTranscript>
            {lines.map((line, index) => (
              <StyledBubble
                key={index}
                data-side={sideFor(speakers, line.speaker)}
              >
                {isDefined(line.speaker) && <small>{line.speaker}</small>}
                {line.text}
              </StyledBubble>
            ))}
          </StyledTranscript>
        ) : (
          <>
            <StyledMuted>
              {isDefined(item.recordingUrl)
                ? t`This call has a recording but no transcript yet.`
                : parsed.links.length > 0
                  ? t`The transcript for this call lives with the call recording.`
                  : t`No recording or transcript for this call.`}
            </StyledMuted>
            <StyledLinks>
              {isDefined(item.recordingUrl) && (
                <button
                  type="button"
                  disabled={isTranscribing}
                  onClick={() => void transcribe()}
                >
                  {isTranscribing ? t`Transcribing...` : t`Transcribe now`}
                </button>
              )}
              {parsed.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </StyledLinks>
          </>
        ))}

      {tab === 'details' && (
        <>
          {parsed.facts.length > 0 ? (
            <StyledFacts>
              {parsed.facts.map((fact, index) => (
                <div key={index} style={{ display: 'contents' }}>
                  <dt>{fact.label}</dt>
                  <dd>{cleanMarkdown(fact.value)}</dd>
                </div>
              ))}
            </StyledFacts>
          ) : (
            <StyledMuted>{t`No call details.`}</StyledMuted>
          )}
          {parsed.links.length > 0 && (
            <StyledLinks>
              {parsed.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </StyledLinks>
          )}
        </>
      )}
    </StyledBody>
  );
};
