import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Circle,
  Mail,
  MoreHorizontal,
  Phone,
  Play,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Trans } from '@lingui/react';
import { Button } from '@/components/ui/button';

export type AvatarList = { image: string };
export default function HeroSection({
  avatarList,
}: {
  avatarList: AvatarList[];
}) {
  return (
    <section
      id="home"
      className="bs-hero bs-shell"
      aria-labelledby="bs-hero-title"
    >
      <div className="bs-hero-copy">
        <a className="bs-announcement" href="#workspace">
          <span className="bs-live-dot" />
          <Trans id="Meet your connected workspace" />
          <ChevronRight size={14} />
        </a>
        <h1 id="bs-hero-title">
          <Trans id="Less busywork." />
          <br />
          <span>
            <Trans id="More momentum." />
          </span>
        </h1>
        <p className="bs-hero-description">
          <Trans id="Your people, pipeline, and conversations. Finally in sync. Move from the first hello to the next big win with BlackSync Cloud." />
        </p>
        <div className="bs-hero-actions">
          <Button asChild size="lg" className="bs-button">
            <a href="/welcome">
              <Trans id="Open your workspace" />
              <ArrowUpRight size={18} />
            </a>
          </Button>
          <a href="#workspace" className="bs-tour">
            <span className="bs-play">
              <Play size={12} fill="currentColor" />
            </span>
            <Trans id="Take a closer look" />
          </a>
        </div>
        <div className="bs-people">
          <div className="bs-avatars">
            {avatarList.map(({ image }) => (
              <img
                key={image}
                src={image}
                alt=""
                width="34"
                height="34"
                loading="lazy"
              />
            ))}
          </div>
          <p>
            <Trans id="For people who build" />
            <br />
            <span>
              <Trans id="relationships, not spreadsheets." />
            </span>
          </p>
        </div>
      </div>
      <div
        className="bs-hero-art"
        aria-label="Illustrative BlackSync workspace with a call summary and sales pipeline"
      >
        <div className="bs-art-grid" />
        <div className="bs-orbit bs-orbit-one" />
        <div className="bs-orbit bs-orbit-two" />
        <div className="bs-art-glow" />
        <div className="bs-art-label">
          <span className="bs-live-dot" />
          <Trans id="EVERYTHING. CONNECTED." />
        </div>
        <div className="bs-landscape">
          <img
            src="/images/landing/violet-sky.jpg"
            alt="City lights at night"
            fetchPriority="high"
          />
          <div className="bs-landscape-shade" />
          <span>BLACKSYNC CLOUD</span>
        </div>
        <div className="bs-orbit-mark">
          <img
            src="/images/integrations/blacksync-pulse-logo.svg"
            width="68"
            height="68"
            alt="BlackSync"
          />
        </div>
        <div className="bs-call-card">
          <div className="bs-card-top">
            <span className="bs-icon-tile">
              <Phone size={16} />
            </span>
            <div>
              <strong>
                <Trans id="A conversation. Captured." />
              </strong>
              <small>
                <Trans id="Example call summary" />
              </small>
            </div>
            <MoreHorizontal size={18} className="bs-dim" />
          </div>
          <div className="bs-waveform" aria-hidden="true">
            {Array.from({ length: 42 }, (_, index) => (
              <i
                key={index}
                style={{ height: `${8 + ((index * 17 + 13) % 33)}px` }}
              />
            ))}
          </div>
          <div className="bs-card-bottom">
            <span>
              <Sparkles size={12} />
              <Trans id="Ready for your next move" />
            </span>
            <span>02:34</span>
          </div>
        </div>
        <div className="bs-pipeline-card">
          <div className="bs-card-top">
            <span className="bs-icon-tile bs-icon-green">
              <Zap size={15} />
            </span>
            <strong>
              <Trans id="Keep the deal moving" />
            </strong>
            <span className="bs-demo-tag">
              <Trans id="PREVIEW" />
            </span>
          </div>
          <div className="bs-deal-row">
            <div className="bs-company">N</div>
            <div>
              <strong>Northstar Studio</strong>
              <small>
                <Trans id="Proposal sent" />
              </small>
            </div>
            <span className="bs-deal-status">
              <Check size={12} />
              <Trans id="On track" />
            </span>
          </div>
          <div className="bs-stage-line">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="bs-pipeline-footer">
            <span>
              <Users size={12} />
              <Trans id="One shared view" />
            </span>
            <ArrowUpRight size={14} />
          </div>
        </div>
        <div className="bs-floating-chip">
          <Mail size={14} />
          <Trans id="One less follow-up to forget" />
          <span className="bs-chip-check">
            <Check size={11} />
          </span>
        </div>
        <div className="bs-art-caption">
          <Circle size={7} fill="currentColor" />
          <Trans id="YOUR NEXT CHAPTER STARTS HERE" />
          <ArrowDown size={12} />
        </div>
      </div>
    </section>
  );
}
