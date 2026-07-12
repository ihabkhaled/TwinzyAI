<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Layer boundaries, module topology, cross-cutting structure

Task type: `architecture-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Layer boundaries are ESLint-enforced; changes need the plugin updated in the same stream.
- An ADR records any boundary/topology decision (architecture/adrs/).
- context/architecture-map.md and knowledge/summaries/architecture.md update together.

## Must-read docs

- context/architecture-map.md — > This is the **single source of truth** for how `apps/api` is structured. Every rule in [`/rules`](../rules/README.md), every skill in [`/skills`](../skills/README.md), every reviewer in [`/agents`](../agents/README.md), and the custom ... (~5586 tokens)
- docs/eslint-architecture.md — Flat config split by concern under /eslint, composed in eslint/index.mjs (prettier last), root (~1925 tokens)
- rules/01-architecture.md — > The monorepo layout, the one-way layering rule, and the module boundary rule that everything else builds on. This file implements [`/context/architecture-map.md`](../context/architecture-map.md) and rules 16–23 of [00-non-negotiable-ru... (~1348 tokens)

## Rules

- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)
- rules/16-backend-architecture.md — > The canonical anatomy of `apps/api`. This file applies [`/context/architecture-map.md`](../context/architecture-map.md) to Twinzy and implements rules 16–23 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md). If anything her... (~1603 tokens)
- rules/10-library-modularization.md — > Every external library that touches product behavior is owned by **exactly one adapter/module**. Business code depends on *our* interface — never the vendor SDK. Swapping a vendor touches one folder. Implements rules 30 and 39 of [00-n... (~1544 tokens)

## Skills

- skills/create-module.md
- skills/add-library.md

## Reviewers

- agents/backend-architect.md
- agents/eslint-boundary-reviewer.md

## Code entrypoints

- `eslint/`
- `context/architecture-map.md`

## Validation before done

- `npm run validate`

## Notes

The architecture plugin lives in eslint/architecture-plugin (backend) and eslint/frontend-architecture-plugin (web). Never relax a rule to make a migration pass — migrate the code.
