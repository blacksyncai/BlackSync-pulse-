import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  GitBranch,
  MessageSquare,
  Phone,
  Users,
} from 'lucide-react';
import { Trans } from '@lingui/react';
import Header, {
  Brand,
  type NavigationSection,
} from '@/components/ui/hero-01-utils/header';
import '@/components/styles/landing.css';

const navigation: NavigationSection[] = [
  { title: 'Overview', href: '#home', isActive: true },
  { title: 'Workspace', href: '#workspace' },
  { title: 'How it works', href: '#workflow' },
  { title: 'FAQ', href: '#faq' },
];

export default function BlackSyncLandingPage() {
  return (
    <div className="bs-landing">
      <a href="#home" className="bs-skip-link">
        <Trans id="Skip to content" />
      </a>
      <Header navigationData={navigation} />
      <main>
        <section
          id="home"
          className="bs-shell bs-hero"
          aria-labelledby="bs-hero-title"
        >
          <div className="bs-hero-copy">
            <p className="bs-eyebrow">
              <span />
              <Trans id="A CLEARER WAY TO CRM" />
            </p>
            <h1 id="bs-hero-title">
              <Trans id="Every relationship." />
              <br />
              <em>
                <Trans id="A clear next step." />
              </em>
            </h1>
            <p className="bs-hero-description">
              <Trans id="The call, the context, the follow-up. Keep your people and pipeline together in a workspace built to move business forward." />
            </p>
            <div className="bs-hero-actions">
              <a href="/welcome" className="bs-button">
                <Trans id="Open your workspace" />
                <ArrowUpRight size={18} />
              </a>
              <a href="#workspace" className="bs-text-link">
                <Trans id="Explore BlackSync" />
                <ArrowDown size={16} />
              </a>
            </div>
            <div className="bs-hero-note">
              <Check size={15} />
              <Trans id="Contacts. Conversations. Pipeline. Client work." />
            </div>
          </div>
          <div className="bs-product-wrap">
            <div className="bs-product-caption">
              <span>
                <span className="bs-small-dot" />
                <Trans id="YOUR WORK, CONNECTED" />
              </span>
              <span>
                <Trans id="Workspace preview" />
              </span>
            </div>
            <div
              className="bs-product"
              aria-label="Illustrative BlackSync workspace with example data"
            >
              <div className="bs-preview-top">
                <strong>
                  BlackSync
                  <span>
                    {' '}
                    / <Trans id="My day" />
                  </span>
                </strong>
                <span className="bs-initial">JL</span>
              </div>
              <div className="bs-preview-content">
                <div className="bs-preview-heading">
                  <div>
                    <small>
                      <Trans id="LESS SEARCHING. MORE DOING." />
                    </small>
                    <h2>
                      <Trans id="Make the next move." />
                    </h2>
                  </div>
                  <span className="bs-preview-date">
                    <Clock3 size={13} />
                    <Trans id="Today" />
                  </span>
                </div>
                <div className="bs-preview-focus">
                  <div className="bs-preview-label">
                    <span>
                      <Phone size={14} />
                      <Trans id="NEXT CONVERSATION" />
                    </span>
                    <span className="bs-warm-chip">
                      <Trans id="Follow up" />
                    </span>
                  </div>
                  <div className="bs-preview-contact">
                    <span className="bs-contact-initial">JL</span>
                    <div>
                      <strong>Jordan Lee</strong>
                      <span>
                        Northstar Studio · <Trans id="Decision maker" />
                      </span>
                    </div>
                    <ArrowUpRight size={16} />
                  </div>
                  <p>
                    <Trans id="Proposal shared. Pick up the conversation with every detail in reach." />
                  </p>
                  <div className="bs-preview-context">
                    <span>
                      <MessageSquare size={13} />
                      <Trans id="Call notes" />
                    </span>
                    <span>
                      <GitBranch size={13} />
                      <Trans id="Proposal sent" />
                    </span>
                  </div>
                </div>
                <div className="bs-preview-bottom">
                  <section>
                    <span className="bs-preview-label">
                      <CheckCheck size={14} />
                      <Trans id="KEEP IT MOVING" />
                    </span>
                    <div className="bs-preview-task">
                      <span className="bs-check-box">
                        <Check size={11} />
                      </span>
                      <span>
                        <Trans id="Send the proposal" />
                        <small>
                          <Trans id="Completed" />
                        </small>
                      </span>
                    </div>
                    <div className="bs-preview-task">
                      <span className="bs-check-box is-open" />
                      <span>
                        <Trans id="Confirm the next steps" />
                        <small>
                          <Trans id="Assigned to you" />
                        </small>
                      </span>
                    </div>
                  </section>
                  <section className="bs-preview-stage">
                    <span className="bs-preview-label">
                      <GitBranch size={14} />
                      <Trans id="PIPELINE" />
                    </span>
                    <strong>
                      <Trans id="A little closer." />
                    </strong>
                    <div className="bs-progress">
                      <i />
                      <i />
                      <i className="is-current" />
                      <i />
                    </div>
                    <small>
                      <Trans id="New → Qualified → Proposal → Won" />
                    </small>
                  </section>
                </div>
              </div>
              <div className="bs-preview-footer">
                <span className="bs-small-dot" />
                <Trans id="Example data · Your workspace brings the real story." />
              </div>
            </div>
          </div>
        </section>
        <div className="bs-capabilities bs-shell">
          <span>
            <Users size={16} />
            <Trans id="People & companies" />
          </span>
          <span>
            <Phone size={16} />
            <Trans id="Calls & conversations" />
          </span>
          <span>
            <GitBranch size={16} />
            <Trans id="Sales pipelines" />
          </span>
          <span>
            <CheckCheck size={16} />
            <Trans id="Tasks & client work" />
          </span>
        </div>
        <section
          id="workspace"
          className="bs-shell bs-section"
          aria-labelledby="bs-workspace-title"
        >
          <div className="bs-section-heading">
            <p className="bs-eyebrow">
              <Trans id="BUILT FOR THE FOLLOW-THROUGH" />
            </p>
            <h2 id="bs-workspace-title">
              <Trans id="The whole relationship." />
              <br />
              <span>
                <Trans id="Right where you need it." />
              </span>
            </h2>
            <p>
              <Trans id="Give your team the context to act, without jumping between scattered notes, calls, and spreadsheets." />
            </p>
          </div>
          <div className="bs-feature-grid">
            <article>
              <div className="bs-feature-top">
                <Users size={22} />
                <span>01</span>
              </div>
              <h3>
                <Trans id="Know who you’re talking to." />
              </h3>
              <p>
                <Trans id="Contacts, companies, notes, and history together. Open a record and pick up where the last conversation left off." />
              </p>
              <span className="bs-feature-detail">
                <Trans id="People + context" />
                <ArrowUpRight size={16} />
              </span>
            </article>
            <article>
              <div className="bs-feature-top">
                <Phone size={22} />
                <span>02</span>
              </div>
              <h3>
                <Trans id="Keep the conversation close." />
              </h3>
              <p>
                <Trans id="Review logged calls, recordings, and synced transcripts alongside the relationship. Less digging for what was said." />
              </p>
              <span className="bs-feature-detail">
                <Trans id="Calls + conversations" />
                <ArrowUpRight size={16} />
              </span>
            </article>
            <article>
              <div className="bs-feature-top">
                <CheckCheck size={22} />
                <span>03</span>
              </div>
              <h3>
                <Trans id="Make the next step obvious." />
              </h3>
              <p>
                <Trans id="Move deals through your pipeline, assign follow-ups, and organize client tickets so work has an owner and a place to land." />
              </p>
              <span className="bs-feature-detail">
                <Trans id="Pipeline + ownership" />
                <ArrowUpRight size={16} />
              </span>
            </article>
          </div>
        </section>
        <section id="workflow" className="bs-workflow">
          <div className="bs-shell bs-workflow-grid">
            <div>
              <p className="bs-eyebrow">
                <Trans id="FROM FIRST HELLO TO FOLLOW-THROUGH" />
              </p>
              <h2>
                <Trans id="A better rhythm" />
                <br />
                <em>
                  <Trans id="for your team." />
                </em>
              </h2>
              <a href="/welcome" className="bs-text-link">
                <Trans id="Get into your workspace" />
                <ArrowRight size={17} />
              </a>
            </div>
            <ol className="bs-steps">
              <li>
                <span>01</span>
                <div>
                  <h3>
                    <Trans id="Bring your relationships in." />
                  </h3>
                  <p>
                    <Trans id="Import contacts and organize the people and companies your team works with." />
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>
                    <Trans id="Give every deal a direction." />
                  </h3>
                  <p>
                    <Trans id="Use your pipeline stages to see what’s moving and what needs attention." />
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>
                    <Trans id="Leave a clear next step." />
                  </h3>
                  <p>
                    <Trans id="Turn the conversation into an assigned task or client ticket, with the context attached." />
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
        <section
          id="faq"
          className="bs-shell bs-section bs-faq"
          aria-labelledby="bs-faq-title"
        >
          <div>
            <p className="bs-eyebrow">
              <Trans id="A FEW GOOD QUESTIONS" />
            </p>
            <h2 id="bs-faq-title">
              <Trans id="Before you jump in." />
            </h2>
          </div>
          <div className="bs-faq-items">
            <details>
              <summary>
                <Trans id="Can I bring my existing contacts?" />
                <span>+</span>
              </summary>
              <p>
                <Trans id="Yes. Use the workspace’s import tools to bring in contacts and company records, then organize them with fields and views that fit your process." />
              </p>
            </details>
            <details>
              <summary>
                <Trans id="Can I customize the way my team works?" />
                <span>+</span>
              </summary>
              <p>
                <Trans id="Customize fields, pipeline stages, record layouts, and views. Assign tasks and client work to keep ownership clear." />
              </p>
            </details>
            <details>
              <summary>
                <Trans id="What happens to my calls and email?" />
                <span>+</span>
              </summary>
              <p>
                <Trans id="Connected accounts and calling integrations bring activity into your workspace. Recording and transcript availability depends on the source call and your integration setup. Calling numbers and email connections are configured separately." />
              </p>
            </details>
          </div>
        </section>
        <section className="bs-shell bs-final-cta">
          <p className="bs-eyebrow">
            <Trans id="YOUR NEXT MOVE STARTS HERE" />
          </p>
          <h2>
            <Trans id="Good relationships deserve" />
            <br />
            <em>
              <Trans id="a better workspace." />
            </em>
          </h2>
          <a href="/welcome" className="bs-button">
            <Trans id="Open BlackSync" />
            <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <footer className="bs-shell bs-footer">
        <Brand />
        <p>
          <Trans id="Built for the follow-through." />
        </p>
        <a href="/welcome" className="bs-text-link">
          <Trans id="Log in" />
          <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  );
}
