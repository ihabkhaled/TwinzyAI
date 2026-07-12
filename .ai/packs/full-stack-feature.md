<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Feature spanning api + web + shared contracts

Task type: `full-stack-feature` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- The shared zod schema in packages/shared is the single contract; both sides derive from it.
- Backend validates at the transport edge; the frontend never trusts its own validation alone.
- Ship api + web + shared + tests + docs in one reviewable stream.

## Must-read docs

- context/architecture-map.md — > This is the **single source of truth** for how `apps/api` is structured. Every rule in [`/rules`](../rules/README.md), every skill in [`/skills`](../skills/README.md), every reviewer in [`/agents`](../agents/README.md), and the custom ... (~5717 tokens)
- context/declaration-ownership-map.md — The one answer sheet for "where does X live?". Search-then-extend ([rules/29](../rules/29-reuse-before-creating.md)): if the owner exists, extend it; never create a parallel owner. Enforced mechanically by `architecture/no-inline-domain-... (~838 tokens)

## Rules

- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)
- rules/05-types-enums-constants.md — > The zero-inline policy in depth. Every type, enum-map, and reusable constant lives in its own dedicated file; every domain value is an as-const member, never a raw string literal. **The TypeScript `enum` keyword is banned repo-wide** —... (~2326 tokens)
- rules/21-dto-validation.md — > Validate **every** boundary with a zod schema before anything reaches the application layer. **Zod is the validation vendor; `class-validator` and `class-transformer` are forbidden repo-wide.** DTO schemas live in `api/dto/` backed by ... (~1556 tokens)

## Skills

- skills/create-feature.md
- skills/create-dto-validation.md
- skills/add-api-service-method.md

## Reviewers

- agents/backend-architect.md
- agents/frontend-architect.md

## Code entrypoints

- `packages/shared/src/`

## Validation before done

- `npm run validate`

## Notes

Sequence: shared schema → api (dto + controller + use case) → web gateway → hook → UI → e2e. Rebuild shared (npm run build:shared) before lint/typecheck.
