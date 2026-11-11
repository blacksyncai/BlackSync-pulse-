import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export type GlassSettings = {
  blur: number;
  opacity: number;
  saturation: number;
  tint: string;
  edge: number;
};

const defaults: GlassSettings = {
  blur: 22,
  opacity: 0.72,
  saturation: 1.2,
  tint: '#ffffff',
  edge: 0.6,
};
const preferenceKey = 'blacksync.dashboard.glass.v1';
const bounded = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
const normalize = (value: Partial<GlassSettings>): GlassSettings => ({
  blur: bounded(value.blur, 0, 40, defaults.blur),
  opacity: bounded(value.opacity, 0.4, 0.95, defaults.opacity),
  saturation: bounded(value.saturation, 0.5, 2, defaults.saturation),
  edge: bounded(value.edge, 0, 1, defaults.edge),
  tint:
    typeof value.tint === 'string' && /^#[0-9a-f]{6}$/i.test(value.tint)
      ? value.tint
      : defaults.tint,
});
const readPreference = (): GlassSettings => {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(preferenceKey) ?? 'null',
    );
    return saved && typeof saved === 'object'
      ? normalize(saved as Partial<GlassSettings>)
      : defaults;
  } catch {
    return defaults;
  }
};

const StyledWorkspace = styled.div`
  --dashboard-glass-surface: color-mix(
    in srgb,
    var(--t-background-primary) calc(var(--dashboard-opacity) * 100%),
    transparent
  );
  --dashboard-glass-edge: color-mix(
    in srgb,
    var(--dashboard-tint) calc(var(--dashboard-edge) * 60%),
    var(--t-border-color-light)
  );
  color: var(--t-font-color-primary);
  position: relative;
  width: 100%;
  .glass-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
    color: var(--t-font-color-secondary);
    font-size: 12px;
  }
  .glass-toolbar button,
  .glass-settings button {
    align-items: center;
    display: inline-flex;
    gap: 8px;
    background: var(--dashboard-glass-surface);
    color: var(--t-font-color-primary);
    border: 1px solid var(--dashboard-glass-edge);
    border-radius: 12px;
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--t-accent-accent9);
    outline-offset: 3px;
  }
  .glass-settings {
    background: var(--t-background-primary);
    border: 1px solid var(--t-border-color-medium);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: var(--bs-shadow);
  }
  .glass-settings header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }
  .glass-settings h2 {
    margin: 0;
    font-size: 16px;
  }
  .glass-controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
    margin-bottom: 20px;
  }
  .glass-controls label {
    display: grid;
    gap: 14px;
    font-size: 12px;
  }
  .glass-controls label span {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .glass-controls output {
    color: var(--t-font-color-secondary);
  }
  input[type='range'] {
    width: 100%;
    margin: 0;
    accent-color: var(--t-accent-accent9);
  }
  .glass-tint {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    margin-right: 20px;
  }
  input[type='color'] {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  @media (max-width: 760px) {
    .glass-controls {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 420px) {
    .glass-controls {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (prefers-reduced-transparency: reduce) {
    --dashboard-glass-surface: var(--t-background-primary);
    --dashboard-blur: 0px !important;
  }
`;

export type GlassWorkspaceProps = {
  children: ReactNode;
  glass?: Partial<GlassSettings>;
  onGlassChange?: (settings: GlassSettings) => void;
  className?: string;
};

// Material and responsive controls adapted from the supplied glass-dashboard UI.
// CRM content stays in its native permission-bound hooks and record components.
export default function GlassWorkspace({
  children,
  glass,
  onGlassChange,
  className,
}: GlassWorkspaceProps) {
  const { t } = useLingui();
  const settingsId = useId();
  const [material, setMaterial] = useState(() =>
    glass ? normalize(glass) : readPreference(),
  );
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const update = (patch: Partial<GlassSettings>) => {
    const next = normalize({ ...material, ...patch });
    setMaterial(next);
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(next));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    onGlassChange?.(next);
  };
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const controls = [
    {
      key: 'blur',
      label: t`Blur`,
      min: 0,
      max: 40,
      step: 1,
      value: `${material.blur}px`,
    },
    {
      key: 'opacity',
      label: t`Opacity`,
      min: 0.4,
      max: 0.95,
      step: 0.01,
      value: `${Math.round(material.opacity * 100)}%`,
    },
    {
      key: 'saturation',
      label: t`Saturation`,
      min: 0.5,
      max: 2,
      step: 0.05,
      value: `${Math.round(material.saturation * 100)}%`,
    },
    {
      key: 'edge',
      label: t`Edge light`,
      min: 0,
      max: 1,
      step: 0.05,
      value: `${Math.round(material.edge * 100)}%`,
    },
  ] as const;
  return (
    <StyledWorkspace
      className={className}
      style={
        {
          '--dashboard-blur': `${material.blur}px`,
          '--dashboard-opacity': material.opacity,
          '--dashboard-saturation': material.saturation,
          '--dashboard-tint': material.tint,
          '--dashboard-edge': material.edge,
        } as CSSProperties
      }
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) close();
      }}
    >
      <div className="glass-toolbar">
        <span>{t`Your workspace. Your next move.`}</span>
        <button
          type="button"
          ref={trigger}
          aria-expanded={open}
          aria-controls={settingsId}
          onClick={() => setOpen(!open)}
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          {t`Adjust glass`}
        </button>
      </div>
      {open && (
        <section
          id={settingsId}
          className="glass-settings"
          aria-label={t`Dashboard appearance`}
        >
          <header>
            <h2>{t`Make this workspace yours`}</h2>
            <button
              type="button"
              onClick={close}
              aria-label={t`Close appearance settings`}
            >
              <X size={16} />
            </button>
          </header>
          <div className="glass-controls">
            {controls.map((control) => (
              <label key={control.key}>
                <span>
                  {control.label}
                  <output>{control.value}</output>
                </span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={material[control.key]}
                  onChange={(event) =>
                    update({ [control.key]: Number(event.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <label className="glass-tint">
            {t`Edge tint`}
            <input
              type="color"
              value={material.tint}
              onChange={(event) => update({ tint: event.target.value })}
            />
          </label>
          <button
            type="button"
            onClick={() => update(defaults)}
          >{t`Reset appearance`}</button>
        </section>
      )}
      {children}
    </StyledWorkspace>
  );
}
