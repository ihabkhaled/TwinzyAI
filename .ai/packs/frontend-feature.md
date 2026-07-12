<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: New or changed Next.js behavior in apps/web

Task type: `frontend-feature` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- TSX is pure composition; state/effects in hooks; HTTP only via the gateway.
- Component/container files cap at 130 lines / 60 per function — split early.
- Every user-facing string goes through i18n (en AND ar in the same change).
- Vendor imports only via apps/web/src/packages/<vendor> wrappers.

## Must-read docs

- rules/frontend/00-non-negotiable-rules.md — These 21 rules are the contract of the `apps/web` frontend. They are never waived in review, never (~2415 tokens)
- context/codebase-navigation.md — > Your fastest path from a task to the right layer, files, rule, and skill. This implements the canon in [architecture-map.md](./architecture-map.md), [stack-and-toolchain.md](./stack-and-toolchain.md), and [rules/00](../rules/00-non-neg... (~4291 tokens)

## Rules

- rules/frontend/01-next-app-router-architecture.md — `apps/web/src/app` is a routing shell, not a feature area. Every file in it MUST be one of the App (~1130 tokens)
- rules/frontend/02-components-and-containers.md — The view layer is split in two: **components** (`*.component.tsx`) render, **containers** (~1078 tokens)
- rules/frontend/03-hooks.md — Module hooks (`apps/web/src/modules/<feature>/hooks/*.hook.ts`) are the orchestration layer: they (~888 tokens)
- rules/02-frontend-components-tsx.md — > Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference. (~438 tokens)

## Skills

- skills/create-component.md
- skills/create-container.md
- skills/create-hook.md

## Reviewers

- agents/frontend-architect.md
- agents/frontend-test-engineer.md

## Code entrypoints

- `apps/web/src/`
- module `web:pkg-icons` at `apps/web/src/packages` (1 files)
- module `web:pkg-image` at `apps/web/src` (2 files)
- module `web:pkg-link` at `apps/web/src` (2 files)

## Validation before done

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`

## Notes

Follow the module anatomy (components/containers/hooks/services/gateway/model). Reuse shared/components design-system pieces before creating new ones.
