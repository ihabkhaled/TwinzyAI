<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: New or changed NestJS behavior in apps/api

Task type: `backend-feature` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- One delegation per controller handler; orchestration lives in a use case.
- Services stay focused (≤ ~20 lines/method); concurrency only in use cases/lib.
- No inline DTOs/types/constants — model/, api/dto/, or packages/shared own them.
- New env reads go through config (env.schema.ts + app-config.service.ts), never process.env.

## Must-read docs

- context/architecture-map.md — > This is the **single source of truth** for how `apps/api` is structured. Every rule in [`/rules`](../rules/README.md), every skill in [`/skills`](../skills/README.md), every reviewer in [`/agents`](../agents/README.md), and the custom ... (~5586 tokens)
- context/reference-patterns.md — > The canonical, copy-ready code for every layer and cross-cutting concern in `apps/api` (plus the shared-contract pattern both apps use). One tight, strict-TypeScript snippet per concern; each obeys the layer/import/lint rules. This imp... (~5277 tokens)

## Rules

- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)
- rules/16-backend-architecture.md — > The canonical anatomy of `apps/api`. This file applies [`/context/architecture-map.md`](../context/architecture-map.md) to Twinzy and implements rules 16–23 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md). If anything her... (~1603 tokens)
- rules/18-routes-controllers.md — > Controllers are the **transport adapter**: they translate HTTP ⇄ application calls and contain **zero business logic**. One delegation per method, mechanically enforced by `architecture/controller-no-logic`. Implements rule 16 of [00-n... (~1369 tokens)
- rules/19-services-application-layer.md — > A service owns **one focused capability** and stays small: guard preconditions → delegate → return a typed result. It never parses HTTP, never holds utility logic, never reads `process.env`, never orchestrates multi-service pipelines (... (~1277 tokens)

## Skills

- skills/create-feature.md
- skills/create-controller.md
- skills/create-use-case.md

## Reviewers

- agents/backend-architect.md
- agents/backend-test-engineer.md

## Code entrypoints

- `apps/api/src/`

## Validation before done

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run build`

## Notes

Copy the closest existing module shape (see structure/modules/) instead of inventing one. Register new modules in app.module.ts and expose a minimal index.ts public surface. Integration tests live beside the module in tests/.
