# BlackSync Cloud landing page

The page lives in the existing `twenty-front` React/TypeScript application.

- `/landing` is a public route in both domain modes, outside the auth and metadata route gates.
- `/` also shows the landing page on the default domain when multi-workspace mode uses the root router. Workspace home routing stays as configured.
- All access buttons use the existing `/welcome` authentication route. No new account or form backend is introduced.

## Components and styles

This app's `@/*` alias resolves to `src/modules/*`, so `@/components/ui` is physically `packages/twenty-front/src/modules/components/ui`, rather than a new repository-root `/components/ui`. This folder keeps the supplied shadcn imports and generated components consistent and avoids changing aliases used throughout the CRM.

- `src/modules/components/ui/hero-01.tsx`: the supplied hero composition, adapted to BlackSync branding, plus the remaining landing sections.
- `src/modules/components/ui/hero-01-utils/`: header, hero illustration, and capability strip. These helpers were referenced but absent from the supplied component.
- `src/modules/components/ui/demo.tsx`: reusable demo entry point.
- `src/modules/components/styles/landing.css`: landing styles and Tailwind utilities.
- `src/modules/lib/utils.ts`: shadcn class composition helper.
- `components.json`: shadcn CLI configuration.

TypeScript was already configured. Tailwind 3, PostCSS, the requested Radix primitives, CVA, Lucide, `clsx`, `tailwind-merge`, and `tailwindcss-animate` are declared in `package.json` and resolved in the root Yarn lockfile.

Tailwind's preflight is disabled and generated utilities are restricted to `.bs-landing`. Custom CSS and theme tokens use the same boundary, including the Radix sheet portal. This allows shadcn components to coexist with the app's existing Linaria styling. Keep future landing components inside this boundary.

## Setup and development

Use the repository's Node version and Yarn release; do not initialize a separate shadcn project or npm lockfile inside this workspace.

```sh
# From the repository root, using the Node version in .nvmrc:
node .yarn/releases/yarn-4.13.0.cjs install
node .yarn/releases/yarn-4.13.0.cjs nx start twenty-front
```

The existing frontend development server serves `/landing` (normally port 3001). It uses the existing backend/client configuration. To add shadcn primitives later, run the CLI from `packages/twenty-front` so it reads the checked-in aliases:

```sh
yarn dlx shadcn@latest add button sheet input label navigation-menu
```

Review generated styles before replacing the scoped setup. No new global context is required beyond the app's existing Lingui provider. Only the mobile sheet has local React state. Illustrative sample contacts and call information are labeled as preview content; the page does not access customer records.

## Images

Unsplash images are downloaded into `public/images/landing/` so visitors do not rely on a third-party image host. Stock portraits are decorative, not customer endorsements. The capability strip replaces unidentified brand logos with Lucide icons, avoiding unsupported customer or integration claims.

Original image sources:

- https://images.unsplash.com/photo-1519608487953-e999c86e7455
- https://images.unsplash.com/photo-1472099645785-5658abf4ff4e
- https://images.unsplash.com/photo-1494790108377-be9c29b29330
- https://images.unsplash.com/photo-1500648767791-00dcc994a43e
- https://images.unsplash.com/photo-1534528741775-53994a69daeb

The pulse logo reuses `public/images/integrations/blacksync-pulse-logo.svg`.

## Verification

The landing components were checked with strict TypeScript, built with Vite/PostCSS/Tailwind in an isolated harness, and exercised in Chromium at desktop and mobile widths. Checks covered the sign-in destination, FAQ expansion, mobile sheet opening and closing, image loading, horizontal overflow, and browser errors. These checks do not establish a passing full CRM build or a live Railway deployment.

Railway uses `packages/twenty-docker/twenty/Dockerfile.railway`; no hosting settings were changed.
