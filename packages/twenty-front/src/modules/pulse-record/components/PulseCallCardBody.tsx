import { PULSE_SUMMARIZE_CALL } from '@/pulse-record/graphql/pulseSummarizeCall';
import { PULSE_TRANSCRIBE_CALL } from '@/pulse-record/graphql/pulseTranscribeCall';
import { type PulseTimelineItem } from '@/pulse-record/types/PulseTimelineItem';
import { formatCallClock } from '@/pulse-record/utils/formatCallClock';
import { getSpeakerTalkShares } from '@/pulse-record/utils/getSpeakerTalkShares';
import { nameCallSpeakers } from '@/pulse-record/utils/nameCallSpeakers';
import {
  parsePulseCallBody,
  type PulseTranscriptLine,
} from '@/pulse-record/utils/parsePulseCallBody';
import { useApolloClient } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import {
  IconListDetails,
  IconPlayerPause,
  IconPlayerPlay,
  IconSearch,
  IconSparkles,
  IconTextCaption,
} from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const SPEAKER_COLORS = ['#6e56cf', '#3e9be9', '#30a46c', '#f76b15'];
const PLAYBACK_RATES = [1, 1.5, 2];
const COLLAPSED_BULLETS = 2;
const COLLAPSED_SUMMARY_LENGTH = 220;

const StyledSection = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledSummary = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: 22px 1fr;

  > svg {
    color: ${themeCssVariables.font.color.tertiary};
    margin-top: 2px;
  }

  ul {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.md};
    line-height: 1.55;
    margin: 0;
    padding-left: 18px;
  }

  p {
    color: ${themeCssVariables.font.color.primary};
    font-size: ${themeCssVariables.font.size.md};
    line-height: 1.55;
    margin: 0;
    white-space: pre-wrap;
  }
`;

const StyledLinkButton = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 0;
  color: ${themeCssVariables.accent.accent10};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: 0;

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const StyledPlayer = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
`;

const StyledPlayButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.font.color.primary};
  border: 0;
  border-radius: 50%;
  color: ${themeCssVariables.background.primary};
  cursor: pointer;
  display: flex;
  flex: none;
  height: 36px;
  justify-content: center;
  width: 36px;
`;

const StyledClock = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  span {
    color: ${themeCssVariables.font.color.tertiary};
  }
`;

const StyledPlayerActions = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  margin-left: auto;

  button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 6px;
    color: ${themeCssVariables.font.color.secondary};
    cursor: pointer;
    display: flex;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 30px;
    justify-content: center;
    min-width: 30px;
    padding: 0 6px;
  }

  button:hover,
  button[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.accent.accent10};
  }
`;

const StyledScrubber = styled.input`
  accent-color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  width: 100%;
`;

const StyledTracks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StyledTrack = styled.div`
  background: ${themeCssVariables.background.transparent.lighter};
  border-radius: 3px;
  cursor: pointer;
  height: 6px;
  position: relative;

  span {
    border-radius: 2px;
    bottom: 0;
    position: absolute;
    top: 0;
  }
`;

const StyledPlayhead = styled.div`
  background: ${themeCssVariables.font.color.tertiary};
  bottom: -4px;
  position: absolute;
  top: -4px;
  width: 1px;
`;

const StyledLegend = styled.div`
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[4]};

  span {
    align-items: center;
    display: inline-flex;
    gap: 6px;
  }

  i {
    border-radius: 50%;
    display: inline-block;
    height: 10px;
    width: 10px;
  }

  small {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.md};
  }
`;

const StyledSearch = styled.label`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};

  input {
    background: transparent;
    border: 0;
    color: ${themeCssVariables.font.color.primary};
    flex: 1;
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    outline: none;
  }
`;

const StyledTranscript = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 420px;
  overflow-y: auto;
`;

const StyledLine = styled.button`
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  gap: 4px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }

  &[data-active='true'] {
    background: ${themeCssVariables.accent.quaternary};
  }

  header {
    align-items: center;
    color: ${themeCssVariables.font.color.secondary};
    display: flex;
    font-size: ${themeCssVariables.font.size.md};
    gap: 8px;
  }

  i {
    border-radius: 50%;
    display: inline-block;
    height: 9px;
    width: 9px;
  }

  p {
    font-size: ${themeCssVariables.font.size.md};
    line-height: 1.55;
    margin: 0;
  }

  mark {
    background: ${themeCssVariables.color.yellow};
    border-radius: 2px;
    color: inherit;
  }
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

const StyledLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[3]};

  a {
    color: ${themeCssVariables.accent.accent10};
    font-size: ${themeCssVariables.font.size.sm};
    text-decoration: none;
  }
`;

const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
`;

const cleanMarkdown = (markdown: string) =>
  markdown.replace(/\*\*(.*?)\*\*/g, '$1').trim();

const highlight = (text: string, query: string) => {
  if (query.length === 0) {
    return text;
  }

  const index = text.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

type PulseCallCardBodyProps = {
  item: PulseTimelineItem;
};

export const PulseCallCardBody = ({ item }: PulseCallCardBodyProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const apolloClient = useApolloClient();
  const parsed = parsePulseCallBody(item.body);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [transcript, setTranscript] = useState<PulseTranscriptLine[] | null>(
    null,
  );
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rateIndex, setRateIndex] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [search, setSearch] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [canPlayRecording, setCanPlayRecording] = useState(true);

  const lines = transcript ?? parsed.transcript;
  const bullets = aiSummary ?? parsed.aiSummary;
  const speakerNames = nameCallSpeakers(lines, {
    direction: item.direction,
    contactName: item.contactName ?? null,
    repName:
      item.repName ??
      parsed.facts
        .find((fact) => fact.label === 'Logged by')
        ?.value.replace(/ in Close$/i, '') ??
      null,
  });
  const speakers = [...speakerNames.keys()];
  const colorFor = (speaker: string | null) =>
    SPEAKER_COLORS[Math.max(0, speakers.indexOf(speaker ?? '')) % 4];
  const nameFor = (speaker: string | null) =>
    speaker === null ? '' : (speakerNames.get(speaker) ?? speaker);
  const isTimed = lines.some((line) => line.start !== null);
  const lastLineEnd = lines.reduce(
    (latest, line) => Math.max(latest, line.end ?? line.start ?? 0),
    0,
  );
  const totalTime = duration > 0 ? duration : lastLineEnd;
  const shares = isTimed ? getSpeakerTalkShares(lines) : [];
  const query = search.trim();
  const visibleLines = lines
    .map((line, index) => ({ line, index }))
    .filter(
      ({ line }) =>
        query.length === 0 ||
        `${nameFor(line.speaker)} ${line.text}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  const prose = cleanMarkdown(parsed.summary);
  const hasRecording = isDefined(item.recordingUrl) && canPlayRecording;

  const seek = (seconds: number, shouldPlay = true) => {
    const audio = audioRef.current;

    if (!isDefined(audio)) {
      return;
    }

    audio.currentTime = Math.max(0, seconds);

    if (shouldPlay) {
      void audio.play();
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;

    if (!isDefined(audio)) {
      return;
    }

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const handleTimeUpdate = () => {
    const time = audioRef.current?.currentTime ?? 0;

    setCurrentTime(time);

    const index = lines.findIndex((line, lineIndex) => {
      const end = line.end ?? lines[lineIndex + 1]?.start ?? Infinity;

      return line.start !== null && time >= line.start && time < end;
    });

    if (index !== activeLine) {
      setActiveLine(index);
      lineRefs.current[index]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  };

  const cycleRate = () => {
    const next = (rateIndex + 1) % PLAYBACK_RATES.length;

    setRateIndex(next);

    if (isDefined(audioRef.current)) {
      audioRef.current.playbackRate = PLAYBACK_RATES[next];
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    setIsWorking(true);

    try {
      await action();
    } catch (error) {
      enqueueToast({
        variant: 'error',
        children: error instanceof Error ? error.message : t`That didn't work.`,
      });
    } finally {
      setIsWorking(false);
    }
  };

  const transcribe = () =>
    runAction(async () => {
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

      if (!isDefined(text)) {
        enqueueToast({
          variant: 'info',
          children: t`No speech was found in this recording.`,
        });

        return;
      }

      const sections = parsePulseCallBody(text);

      setTranscript(sections.transcript);
      setAiSummary(sections.aiSummary.length > 0 ? sections.aiSummary : null);
      setIsTranscriptOpen(true);
    });

  const summarize = () =>
    runAction(async () => {
      const { data } = await apolloClient.mutate<{
        pulseSummarizeCall: string;
      }>({
        mutation: PULSE_SUMMARIZE_CALL,
        variables: { noteId: item.openRecordId },
      });

      setAiSummary(
        parsePulseCallBody(`**Summary**\n\n${data?.pulseSummarizeCall ?? ''}`)
          .aiSummary,
      );
    });

  const visibleBullets = isSummaryExpanded
    ? bullets
    : bullets.slice(0, COLLAPSED_BULLETS);
  const isProseLong = prose.length > COLLAPSED_SUMMARY_LENGTH;
  const visibleProse =
    isProseLong && !isSummaryExpanded
      ? `${prose.slice(0, COLLAPSED_SUMMARY_LENGTH)}…`
      : prose;
  const canExpandSummary =
    bullets.length > 0
      ? bullets.length > COLLAPSED_BULLETS || prose.length > 0
      : isProseLong;

  return (
    <>
      {(bullets.length > 0 || prose.length > 0 || lines.length > 0) && (
        <StyledSection>
          <StyledSummary>
            <IconSparkles size={20} />
            <div>
              {bullets.length > 0 && (
                <ul>
                  {visibleBullets.map((bullet, index) => (
                    <li key={index}>{cleanMarkdown(bullet)}</li>
                  ))}
                </ul>
              )}
              {(bullets.length === 0 || isSummaryExpanded) &&
                prose.length > 0 && (
                  <p style={bullets.length > 0 ? { marginTop: 8 } : undefined}>
                    {bullets.length > 0 ? prose : visibleProse}
                  </p>
                )}
              {bullets.length === 0 && prose.length === 0 && (
                <StyledMuted>{t`No summary for this call yet.`}</StyledMuted>
              )}
            </div>
          </StyledSummary>
          <div style={{ display: 'flex', gap: 16, paddingLeft: 34 }}>
            {canExpandSummary && (
              <StyledLinkButton
                type="button"
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              >
                {isSummaryExpanded ? t`Show less` : t`Show more...`}
              </StyledLinkButton>
            )}
            {lines.length > 0 && !isTimed && isDefined(item.recordingUrl) && (
              <StyledLinkButton
                type="button"
                disabled={isWorking}
                onClick={() => void transcribe()}
              >
                {isWorking
                  ? t`Working...`
                  : t`Re-transcribe with timestamps and summary`}
              </StyledLinkButton>
            )}
            {bullets.length === 0 && lines.length > 0 && isTimed && (
              <StyledLinkButton
                type="button"
                disabled={isWorking}
                onClick={() => void summarize()}
              >
                {isWorking ? t`Summarizing...` : t`Summarize with AI`}
              </StyledLinkButton>
            )}
          </div>
        </StyledSection>
      )}

      {hasRecording && (
        <StyledSection>
          <audio
            ref={audioRef}
            preload="metadata"
            src={item.recordingUrl ?? undefined}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() =>
              setDuration(
                Number.isFinite(audioRef.current?.duration)
                  ? (audioRef.current?.duration ?? 0)
                  : 0,
              )
            }
            onError={() => setCanPlayRecording(false)}
          />
          <StyledPlayer>
            <StyledPlayButton
              type="button"
              aria-label={isPlaying ? t`Pause` : t`Play`}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <IconPlayerPause size={18} />
              ) : (
                <IconPlayerPlay size={18} />
              )}
            </StyledPlayButton>
            <StyledClock>
              {formatCallClock(currentTime)}{' '}
              <span>/ {formatCallClock(totalTime)}</span>
            </StyledClock>
            <StyledPlayerActions>
              <button
                type="button"
                aria-label={t`Playback speed`}
                onClick={cycleRate}
              >
                {PLAYBACK_RATES[rateIndex]}x
              </button>
              <button
                type="button"
                aria-label={t`Transcript`}
                aria-pressed={isTranscriptOpen}
                onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
              >
                <IconTextCaption size={18} />
              </button>
              <button
                type="button"
                aria-label={t`Call details`}
                aria-pressed={isDetailsOpen}
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              >
                <IconListDetails size={18} />
              </button>
            </StyledPlayerActions>
          </StyledPlayer>
          <StyledScrubber
            type="range"
            aria-label={t`Seek`}
            min={0}
            max={Math.max(1, totalTime)}
            step={0.1}
            value={Math.min(currentTime, Math.max(1, totalTime))}
            onChange={(event) => seek(Number(event.target.value), false)}
          />
        </StyledSection>
      )}

      {isTimed && totalTime > 0 && (
        <StyledSection>
          <StyledTracks>
            {speakers.map((speaker) => (
              <StyledTrack
                key={speaker}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();

                  seek(((event.clientX - rect.left) / rect.width) * totalTime);
                }}
              >
                {lines.map((line, index) =>
                  line.speaker === speaker && line.start !== null ? (
                    <span
                      key={index}
                      style={{
                        background: colorFor(speaker),
                        left: `${(line.start / totalTime) * 100}%`,
                        width: `${Math.max(0.3, (((line.end ?? lines[index + 1]?.start ?? line.start + 1) - line.start) / totalTime) * 100)}%`,
                      }}
                    />
                  ) : null,
                )}
                {hasRecording && (
                  <StyledPlayhead
                    style={{ left: `${(currentTime / totalTime) * 100}%` }}
                  />
                )}
              </StyledTrack>
            ))}
          </StyledTracks>
          <StyledLegend>
            {shares.map(({ speaker, share }) => (
              <span key={speaker}>
                <i style={{ background: colorFor(speaker) }} />
                {nameFor(speaker)} <small>• {share}%</small>
              </span>
            ))}
          </StyledLegend>
        </StyledSection>
      )}

      {lines.length > 0 && (!hasRecording || isTranscriptOpen) && (
        <StyledSection>
          <StyledSearch>
            <IconSearch size={16} />
            <input
              aria-label={t`Search transcript`}
              placeholder={t`Search`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </StyledSearch>
          <StyledTranscript>
            {visibleLines.map(({ line, index }) => (
              <StyledLine
                key={index}
                ref={(node) => {
                  lineRefs.current[index] = node;
                }}
                type="button"
                data-active={index === activeLine}
                onClick={() => line.start !== null && seek(line.start)}
              >
                {line.speaker !== null && (
                  <header>
                    <i style={{ background: colorFor(line.speaker) }} />
                    {nameFor(line.speaker)}
                    {line.start !== null && (
                      <span>{formatCallClock(line.start)}</span>
                    )}
                  </header>
                )}
                <p>{highlight(line.text, query)}</p>
              </StyledLine>
            ))}
            {visibleLines.length === 0 && (
              <StyledMuted>{t`No lines match your search.`}</StyledMuted>
            )}
          </StyledTranscript>
        </StyledSection>
      )}

      {lines.length === 0 &&
        (isDefined(item.recordingUrl) || parsed.links.length > 0) && (
          <StyledSection>
            <StyledLinks>
              {isDefined(item.recordingUrl) && (
                <StyledLinkButton
                  type="button"
                  disabled={isWorking}
                  onClick={() => void transcribe()}
                >
                  {isWorking ? t`Transcribing...` : t`Transcribe this call`}
                </StyledLinkButton>
              )}
              {!canPlayRecording && isDefined(item.recordingUrl) && (
                <a href={item.recordingUrl} target="_blank" rel="noreferrer">
                  {t`Open recording`}
                </a>
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
          </StyledSection>
        )}

      {parsed.facts.length > 0 && (
        <StyledSection>
          {isDetailsOpen ? (
            <>
              <StyledFacts>
                {parsed.facts.map((fact, index) => (
                  <div key={index} style={{ display: 'contents' }}>
                    <dt>{fact.label}</dt>
                    <dd>{cleanMarkdown(fact.value)}</dd>
                  </div>
                ))}
              </StyledFacts>
              <StyledLinkButton
                type="button"
                onClick={() => setIsDetailsOpen(false)}
              >
                {t`Hide details`}
              </StyledLinkButton>
            </>
          ) : (
            <StyledLinkButton
              type="button"
              onClick={() => setIsDetailsOpen(true)}
            >
              {t`Show call details (${parsed.facts.length})`}
            </StyledLinkButton>
          )}
        </StyledSection>
      )}
    </>
  );
};
