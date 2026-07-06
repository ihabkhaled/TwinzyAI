# ADR FE-0001: Strict Next.js frontend architecture (apps/web)

- **Status:** Accepted
- **Date:** 2026-07-06
- **Deciders:** Twinzy frontend maintainers
- **Related:** [rules/00-non-negotiable-rules.md](../../rules/00-non-negotiable-rules.md),
  [rules/01-architecture.md](../../rules/01-architecture.md),
  [context/architecture-map.md](../../context/architecture-map.md),
  [rules/10-library-modularization.md](../../rules/10-library-modularization.md),
  [docs/eslint/README.md](../../docs/eslint/README.md)

## Context

Every large Next.js codebase we have inherited failed the same way. Global `components/`,
`hooks/`, and `utils/` folders grew into hundreds of files with no owner; any file imported any
other file, so refactoring one screen meant regression-testing all of them. Third-party imports
(HTTP client, `dayjs`, `zustand`, `next/link`) were scattered across the tree, so a vendor
breaking change or a security patch became a repo-wide search-and-pray. Components mixed fetching,
state, formatting, and markup, which made them untestable in isolation. Conventions lived in wiki
pages that nobody read; only conventions a machine rejects survive team growth and turnover.

The Twinzy web app in `apps/web` is built as the frontend counterpart of the strict NestJS
operating system in `apps/api`: the same governance brain (root [CLAUDE.md](../../CLAUDE.md)) and
the same principle — discipline is inherited automatically because a linter enforces it, not
because reviewers remember it.

## Decision

We build `apps/web` on five load-bearing choices, each machine-enforced:

1. **Module-first layout.** `apps/web/src/app` holds only routes, layouts, and route handlers.
   Features live in `apps/web/src/modules/<feature>` with fixed layers (`api/`, `gateway/`,
   `services/`, `queries/`, `store/`, `containers/`, `components/`, `hooks/`, `mappers/`,
   `schemas/`, `types/`, `enums/`, `constants/`, `utils/`, `helpers/`, `test/`) and a single
   public surface `index.ts`. Cross-module imports go only through `@/modules/<feature>`.
2. **JSX-only components.** `*.component.tsx` files contain markup only — no hooks, no logic, no
   inline declarations, no raw copy, no raw `className` outside the design system. Containers
   (`*.container.tsx`) connect hooks to components; hooks orchestrate; services and gateways are
   React-free. See [rules/02-frontend-components-tsx.md](../../rules/02-frontend-components-tsx.md).
3. **One owning wrapper per vendor.** Every third-party package is imported in exactly one place
   under `apps/web/src/packages/<vendor>` (e.g. `apps/web/src/packages/http`,
   `apps/web/src/packages/query`, `apps/web/src/packages/i18n`). Product code imports the wrapper,
   never the vendor.
4. **Custom ESLint architecture plugin.** The 13 rules in `apps/web/eslint/architecture-plugin.mjs`
   (layer policy table in `apps/web/eslint/architecture.config.mjs`, ownership map in
   `apps/web/eslint/package-boundaries.config.mjs`) turn every choice above into a lint failure,
   run with `--max-warnings=0`. Each rule is documented in [docs/eslint/](../../docs/eslint/README.md).
5. **BFF gateway.** Browser code calls only the same-origin gateway
   (`apps/web/src/app/api/gateway/[...path]/gateway-handler.ts`), which serves module mock
   fixtures when `SERVER_API_MOCKING=enabled` or proxies to `SERVER_API_BASE_URL` (the NestJS API
   in `apps/api`). The web app can run standalone in mock mode with no backend attached.

## Twinzy product constraints this architecture must uphold

The frontend inherits Twinzy's domain non-negotiables (root [CLAUDE.md](../../CLAUDE.md)): the
game is free (no monetization code), no face-recognition or identity claims, and **no image
persistence** — an uploaded image is sent once to the game-analyze endpoint and never stored,
logged, or cached client-side. The module/layer split keeps the upload path narrow and auditable:
the image lives only in the gateway request, never in a store, the query cache, or storage.

## Consequences

### Positive

- Boundaries are enforced by `npm run lint`, not by review vigilance; violations cannot merge.
- Vendor churn is contained: a breaking major in any package touches one directory.
- JSX-only components plus React-free services make every layer testable in isolation, which is
  what makes the 95%/100% coverage thresholds in `apps/web/vitest.config.mts` realistic.
- New engineers learn the structure once from the `game` reference module and can navigate any
  feature.

### Negative / accepted costs

- Real learning curve: the first week feels slower because the linter rejects habits that were
  legal everywhere else. The [skills/](../../skills/README.md) playbooks exist to offset this.
- More files per feature (component + container + variants + hook) than a quick-and-dirty page.
- The custom plugin is our own code to maintain across ESLint majors.
- Escaping a rule requires a documented exception in
  [docs/exceptions/](../../docs/exceptions/README.md); there is deliberately no cheap way out.

### Revisit trigger

If Next.js App Router conventions change such that the layer model no longer maps onto the
framework (e.g. route handlers or the proxy convention are replaced), or if the plugin's rules
block a legitimate pattern more than they prevent defects, re-evaluate with a superseding ADR.

## Alternatives considered

### Atomic design (atoms/molecules/organisms)

Organizes by visual granularity, not by feature ownership. It answers "how big is this
component?" but not "who owns this behavior?" — fetching, state, and domain logic still end up in
shared folders, reproducing the failure mode we are escaping. Rejected.

### Feature-Sliced Design (FSD)

Closest competitor: it also slices by feature with layered imports. But FSD's
shared/entities/features/widgets layering is generic and unenforced out of the box, and it
prescribes nothing about vendor ownership, JSX-only components, or a BFF. We kept its best idea
(feature slices with a public API) and made the rest stricter and machine-enforced. Rejected
as-is.

### Plain Next.js defaults (colocate everything under app/)

Fine for a weekend project; collapses at team scale for the exact reasons in Context. Colocation
under `apps/web/src/app` gives no import policy, no vendor boundary, and no testable layer
separation. Rejected.

### Do nothing

"Do nothing" here means shipping folder names and a README of intentions. Every predecessor repo
proves that unenforced intentions decay within two quarters. Rejected.
