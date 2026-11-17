import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Trans } from '@lingui/react';

export type NavigationSection = {
  title: string;
  href: string;
  isActive?: boolean;
};
export const Brand = () => (
  <a href="/landing" className="bs-brand" aria-label="BlackSync Cloud home">
    <span>
      BlackSync<span className="bs-brand-cloud">Cloud</span>
    </span>
  </a>
);
export default function Header({
  navigationData,
}: {
  navigationData: NavigationSection[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const close = () => dialog.current?.close();
  return (
    <header className="bs-header">
      <div className="bs-shell bs-header-inner">
        <Brand />
        <nav className="bs-desktop-nav" aria-label="Main navigation">
          {navigationData.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className={`bs-nav-link ${item.isActive ? 'bs-nav-active' : ''}`}
            >
              <Trans id={item.title} />
            </a>
          ))}
        </nav>
        <div className="bs-desktop-actions">
          <a href="/welcome" className="bs-login">
            <Trans id="Log in" />
          </a>
          <a href="/welcome" className="bs-button bs-button-small">
            <Trans id="Get started" />
            <ArrowUpRight size={15} />
          </a>
        </div>
        <button
          type="button"
          className="bs-menu-trigger"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls={dialogId}
          aria-haspopup="dialog"
          onClick={() => {
            dialog.current?.showModal();
            setOpen(true);
          }}
        >
          <Menu size={22} />
        </button>
        <dialog
          ref={dialog}
          id={dialogId}
          className="bs-landing-menu"
          aria-labelledby={`${dialogId}-title`}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (
              event.target === event.currentTarget &&
              (event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom)
            )
              close();
          }}
        >
          <div className="bs-mobile-heading">
            <strong id={`${dialogId}-title`}>BlackSync Cloud</strong>
            <button type="button" onClick={close} aria-label="Close navigation">
              <X size={20} />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {navigationData.map((item) => (
              <a key={item.title} href={item.href} onClick={close}>
                <Trans id={item.title} />
              </a>
            ))}
            <a href="/welcome" onClick={close} className="bs-button">
              <Trans id="Open your workspace" />
              <ArrowUpRight size={16} />
            </a>
          </nav>
        </dialog>
      </div>
    </header>
  );
}
