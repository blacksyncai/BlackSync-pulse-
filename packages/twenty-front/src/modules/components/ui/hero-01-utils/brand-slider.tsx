import type { LucideIcon } from 'lucide-react';
import { Trans } from '@lingui/react';
export type BrandList = { name: string; icon: LucideIcon };
export default function BrandSlider({ brandList }: { brandList: BrandList[] }) {
  return (
    <section
      id="integrations"
      className="bs-integrations bs-shell"
      aria-labelledby="bs-integrations-title"
    >
      <p id="bs-integrations-title">
        <Trans id="ONE WORKSPACE. MORE POSSIBILITIES." />
      </p>
      <div className="bs-brand-list">
        {brandList.map(({ name, icon: Icon }) => (
          <div key={name}>
            <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
            <span>
              <Trans id={name} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
