<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Structure-preserving refactor

Task type: `refactor` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Behavior-preserving; tests stay green without modification (or state why).
- Never weaken validation, safety filters, error handling, or types to simplify.
- Extraction targets the existing owner file; no parallel duplicates.

## Must-read docs

- rules/30-refactor-discipline.md — > Refactors move code to its correct owner without changing behavior — and never weaken privacy, AI safety, upload security, validation, accessibility, i18n, tests, or gates. Agent mirror files stay compact, aligned, and defer to the can... (~722 tokens)
- rules/29-reuse-before-creating.md — > Every new constant, type, helper, service, hook, component, wrapper, or abstraction must first prove that TwinzyAI does not already own it. Duplication is a defect; speculation is a defect. Extends the search-then-extend workflow of [0... (~597 tokens)

## Rules

- rules/28-simple-readable-code.md — > The best TwinzyAI code is the code the next developer understands immediately. Code is written once and read hundreds of times — by juniors, seniors, QA, security/privacy reviewers, and AI coding agents. Optimize for the reader under p... (~859 tokens)
- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)

## Skills

- skills/refactor-feature.md
- skills/decompose-large-file.md
- skills/simplify-existing-code.md

## Reviewers

- agents/backend-refactor-agent.md

## Validation before done

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run quality:dead-code`

## Notes

Run npm run quality:dead-code and quality:circular after moving code. Large decompositions follow skills/decompose-large-file.md slice order.
