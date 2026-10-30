import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Check,
  GitBranch,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { Trans } from '@lingui/react';
import HeroSection, {
  type AvatarList,
} from '@/components/ui/hero-01-utils/hero';
import Header, {
  Brand,
  type NavigationSection,
} from '@/components/ui/hero-01-utils/header';
import BrandSlider, {
  type BrandList,
} from '@/components/ui/hero-01-utils/brand-slider';
import { Button } from '@/components/ui/button';
import '@/components/styles/landing.css';

const AVATAR_LIST: AvatarList[] = [1, 2, 3, 4].map((index) => ({
  image: `/images/landing/avatar-${index}.jpg`,
}));
const NAVIGATION_DATA: NavigationSection[] = [
  { title: 'Overview', href: '#home', isActive: true },
  { title: 'Workspace', href: '#workspace' },
  { title: 'How it works', href: '#workflow' },
  { title: 'FAQ', href: '#faq' },
];
const BRAND_LIST: BrandList[] = [
  { name: 'Relationships', icon: Users },
  { name: 'Conversations', icon: MessageSquare },
  { name: 'Pipeline', icon: GitBranch },
  { name: 'Automations', icon: Workflow },
  { name: 'Intelligence', icon: Sparkles },
];

export default function AgencyHeroSection() {
  return (
    <div className="bs-landing">
      <Header navigationData={NAVIGATION_DATA} />
      <main>
        <HeroSection avatarList={AVATAR_LIST} />
        <BrandSlider brandList={BRAND_LIST} />
        <section
          id="workspace"
          className="bs-features bs-shell"
          aria-labelledby="bs-features-title"
        >
          <div className="bs-section-heading">
            <div>
              <p className="bs-eyebrow">
                <span /> <Trans id="BUILT AROUND YOUR NEXT MOVE" />
              </p>
              <h2 id="bs-features-title">
                <Trans id="All the context." />
                <br />
                <span>
                  <Trans id="None of the chaos." />
                </span>
              </h2>
            </div>
            <p>
              <Trans id="A clearer picture of every relationship. A simpler way to move work forward. Bring it all together in a workspace that feels like yours." />
            </p>
          </div>
          <div className="bs-feature-grid">
            <article className="bs-feature-card">
              <span className="bs-feature-number">01 /</span>
              <div className="bs-mini-contacts">
                <div>
                  <span className="bs-contact-avatar">AM</span>
                  <span>
                    Alex Morgan<small>Northstar Studio</small>
                  </span>
                  <span className="bs-status-pill">
                    <Trans id="Connected" />
                  </span>
                </div>
                <div>
                  <span className="bs-contact-avatar bs-avatar-peach">JL</span>
                  <span>
                    Jamie Lee<small>Orbit Labs</small>
                  </span>
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <h3>
                <Users size={18} />
                <Trans id="Relationships, remembered." />
              </h3>
              <p>
                <Trans id="Keep contacts, companies, notes, and deal history together. Pick up every conversation where you left off." />
              </p>
            </article>
            <article className="bs-feature-card">
              <span className="bs-feature-number">02 /</span>
              <div className="bs-mini-call">
                <span className="bs-icon-tile">
                  <AudioLines size={22} />
                </span>
                <div>
                  <strong>
                    <Trans id="The details stay with you." />
                  </strong>
                  <small>
                    <Trans id="Call recordings linked to your work" />
                  </small>
                </div>
                <span className="bs-record-dot" />
              </div>
              <h3>
                <Phone size={18} />
                <Trans id="Conversations, connected." />
              </h3>
              <p>
                <Trans id="Make calls from your workspace and keep recordings with the relationship, so useful context stays close." />
              </p>
            </article>
            <article className="bs-feature-card">
              <span className="bs-feature-number">03 /</span>
              <div className="bs-mini-flow">
                <span>
                  <Mail size={18} />
                </span>
                <i />
                <span>
                  <Workflow size={18} />
                </span>
                <i />
                <span>
                  <Check size={18} />
                </span>
              </div>
              <h3>
                <Workflow size={18} />
                <Trans id="Busywork, out of the way." />
              </h3>
              <p>
                <Trans id="Connect the steps in your process with workflows. Spend less time moving information and more time moving forward." />
              </p>
            </article>
          </div>
        </section>
        <section id="workflow" className="bs-workflow bs-shell">
          <div className="bs-workflow-intro">
            <p className="bs-eyebrow">
              <span />
              <Trans id="FROM CONTEXT TO ACTION" />
            </p>
            <h2>
              <Trans id="Good work has" />
              <br />
              <span>
                <Trans id="a natural flow." />
              </span>
            </h2>
            <Button asChild variant="outline" className="bs-secondary-button">
              <a href="/welcome">
                <Trans id="Find your flow" />
                <ArrowUpRight size={16} />
              </a>
            </Button>
          </div>
          <ol className="bs-steps">
            <li>
              <span>01</span>
              <div>
                <h3>
                  <Trans id="Bring your world together" />
                </h3>
                <p>
                  <Trans id="Organize your contacts and companies in one shared workspace." />
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>
                  <Trans id="Keep the conversation going" />
                </h3>
                <p>
                  <Trans id="Add notes, manage tasks, and keep the important details close." />
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>
                  <Trans id="Make your next move" />
                </h3>
                <p>
                  <Trans id="Follow your pipeline, connect your workflows, and move forward with context." />
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section id="faq" className="bs-faq bs-shell">
          <div>
            <p className="bs-eyebrow">
              <span />
              <Trans id="A LITTLE MORE CLARITY" />
            </p>
            <h2>
              <Trans id="Good questions." />
              <br />
              <span>
                <Trans id="Straight answers." />
              </span>
            </h2>
          </div>
          <div className="bs-faq-list">
            <details>
              <summary>
                <Trans id="What is BlackSync Cloud?" />
                <span>+</span>
              </summary>
              <p>
                <Trans id="BlackSync Cloud is a connected CRM built on the open-source Twenty platform, bringing relationships, sales pipelines, calls, and workflows into one place." />
              </p>
            </details>
            <details>
              <summary>
                <Trans id="How do I access my workspace?" />
                <span>+</span>
              </summary>
              <p>
                <Trans id="Choose Open your workspace or Log in to continue through the existing BlackSync sign-in and onboarding flow." />
              </p>
            </details>
            <details>
              <summary>
                <Trans id="Can I make it work my way?" />
                <span>+</span>
              </summary>
              <p>
                <Trans id="Use custom fields, views, and workflows to organize your team's process. Available features and integrations depend on your workspace configuration." />
              </p>
            </details>
          </div>
        </section>
        <section className="bs-final-cta bs-shell">
          <span className="bs-cta-orbit" />
          <p className="bs-eyebrow">
            <Sparkles size={14} />
            <Trans id="LESS FRICTION. MORE FORWARD." />
          </p>
          <h2>
            <Trans id="Your next big move" />
            <br />
            <span>
              <Trans id="starts with a connection." />
            </span>
          </h2>
          <Button asChild size="lg" className="bs-button">
            <a href="/welcome">
              <Trans id="Get started with BlackSync" />
              <ArrowRight size={18} />
            </a>
          </Button>
        </section>
      </main>
      <footer className="bs-footer bs-shell">
        <Brand />
        <p>
          <Trans id="Built for the way you move." />
        </p>
        <a href="/welcome">
          <Trans id="Enter workspace" />
          <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}
