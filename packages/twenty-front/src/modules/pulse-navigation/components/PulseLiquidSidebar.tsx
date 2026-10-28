import { type ReactNode, useCallback, useEffect, useRef } from 'react';

// Vertical port of the "Waterline" liquid navbar (Nimbus UI, guglielmogiannattasio.it):
// the active drop springs toward the selected item with a lagging tail that stretches,
// squashes on arrival and leaves a ripple. Drawn with CSS so it stays cheap in a sidebar.

const LIQUID_CSS = `
.pulse-liquid{position:relative}
.pulse-liquid [aria-current="page"]{background:transparent!important;box-shadow:none!important}
.pulse-liquid-drop{position:absolute;left:0;right:0;top:0;height:0;border-radius:10px;pointer-events:none;z-index:0;opacity:0;
  will-change:transform,height;transition:opacity .25s;
  background:radial-gradient(120% 160% at 25% 0%,rgba(255,255,255,.28),rgba(255,255,255,0) 55%),var(--t-accent-quaternary);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.35),inset 0 -2px 8px var(--t-accent-tertiary),inset 0 0 0 1px var(--t-accent-accent6),0 6px 18px -8px var(--t-accent-accent9)}
.pulse-liquid-drop::after{content:"";position:absolute;left:0;top:6px;bottom:6px;width:3px;border-radius:3px;background:var(--t-accent-accent9)}
.pulse-liquid > *:not(.pulse-liquid-drop):not(.pulse-liquid-ripple){position:relative;z-index:1}
.pulse-liquid-ripple{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;pointer-events:none;z-index:0;
  border:1.5px solid var(--t-accent-accent9);animation:pulseRipple .7s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes pulseRipple{from{opacity:.7;transform:scale(1)}to{opacity:0;transform:scale(9)}}
@media (prefers-reduced-motion:reduce){.pulse-liquid-ripple{display:none}}
`;

type Body = { y: number; v: number };

type PulseLiquidSidebarProps = {
  children: ReactNode;
};

export const PulseLiquidSidebar = ({ children }: PulseLiquidSidebarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    head: { y: 0, v: 0 } as Body,
    tail: { y: 0, v: 0 } as Body,
    squash: { s: 1, v: 0 },
    targetTop: 0,
    targetHeight: 0,
    lagUntil: 0,
    ready: false,
    visible: false,
    raf: 0,
    last: 0,
    reduce: false,
  });

  const render = useCallback(() => {
    const s = state.current;
    const drop = dropRef.current;
    if (!drop) return;
    const top = Math.min(s.head.y, s.tail.y);
    const height = Math.abs(s.head.y - s.tail.y) + s.targetHeight;
    drop.style.opacity = s.visible ? '1' : '0';
    drop.style.height = `${height}px`;
    drop.style.transform = `translateY(${top}px) scaleX(${s.squash.s})`;
  }, []);

  const loop = useCallback(() => {
    const s = state.current;
    if (s.raf !== 0) return;
    s.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      let isSettled = true;
      if (s.reduce) {
        s.head.y = s.tail.y = s.targetTop;
        s.squash.s = 1;
      } else {
        [s.head, s.tail].forEach((body, index) => {
          const isHead = index === 0;
          const stiffness = isHead ? 210 : 72;
          const damping = isHead ? 25 : 13;
          const lag = !isHead && now < s.lagUntil ? 0.08 : 1;
          body.v +=
            (stiffness * (s.targetTop - body.y) - damping * body.v) * dt * lag;
          body.y += body.v * dt;
          if (Math.abs(s.targetTop - body.y) > 0.3 || Math.abs(body.v) > 3) {
            isSettled = false;
          }
        });
        const squashTarget = 1 - 0.12 * Math.min(Math.abs(s.head.v) / 1500, 1);
        s.squash.v += (280 * (squashTarget - s.squash.s) - 9 * s.squash.v) * dt;
        s.squash.s += s.squash.v * dt;
        if (Math.abs(s.squash.s - 1) > 0.002 || Math.abs(s.squash.v) > 0.02) {
          isSettled = false;
        }
      }
      render();
      s.raf = isSettled ? 0 : requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
  }, [render]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const s = state.current;
    const active = container.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    if (!active) {
      s.visible = false;
      render();
      return;
    }
    const containerBox = container.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();
    const top = activeBox.top - containerBox.top;
    s.targetHeight = activeBox.height;
    s.visible = true;
    if (!s.ready) {
      s.head.y = s.tail.y = top;
      s.ready = true;
    } else if (Math.abs(top - s.targetTop) > 0.5) {
      // Whichever end is closer leads, the other trails behind like a stretched drop.
      if (Math.abs(top - s.tail.y) < Math.abs(top - s.head.y)) {
        [s.head, s.tail] = [s.tail, s.head];
      }
      s.lagUntil = performance.now() + 70;
    }
    s.targetTop = top;
    loop();
  }, [loop, render]);

  useEffect(() => {
    state.current.reduce =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const container = containerRef.current;
    if (!container) return;
    const mutationObserver = new MutationObserver(() => measure());
    mutationObserver.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-current'],
    });
    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(container);
    measure();
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(state.current.raf);
      state.current.raf = 0;
    };
  }, [measure]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || state.current.reduce) return;
    const box = container.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'pulse-liquid-ripple';
    ripple.style.left = `${event.clientX - box.left}px`;
    ripple.style.top = `${event.clientY - box.top}px`;
    container.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  };

  return (
    <div
      ref={containerRef}
      className="pulse-liquid"
      onPointerDown={handlePointerDown}
    >
      <style>{LIQUID_CSS}</style>
      <div ref={dropRef} className="pulse-liquid-drop" aria-hidden="true" />
      {children}
    </div>
  );
};
