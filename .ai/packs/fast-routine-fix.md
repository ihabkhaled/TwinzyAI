<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Small localized bug fix or cleanup

Task type: `routine-fix` · Lane: **fast** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Smallest safe change; no drive-by refactors in the same commit.
- A bug fix ships with a regression test in the same change.
- No new files when an existing owner file can absorb the change (rules/29).

## Must-read docs

- context/architecture-map.md — > This is the **single source of truth** for how `apps/api` is structured. Every rule in [`/rules`](../rules/README.md), every skill in [`/skills`](../skills/README.md), every reviewer in [`/agents`](../agents/README.md), and the custom ... (~5717 tokens)

## Rules

- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)
- rules/28-simple-readable-code.md — > The best TwinzyAI code is the code the next developer understands immediately. Code is written once and read hundreds of times — by juniors, seniors, QA, security/privacy reviewers, and AI coding agents. Optimize for the reader under p... (~859 tokens)

## Skills

- skills/investigate-production-bug.md
- skills/write-unit-tests.md

## Reviewers

- agents/backend-code-reviewer.md

## Validation before done

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`

## Notes

Read the owner file and its test before editing. If the fix touches any critical path from knowledge/risk-classification.yaml, STOP and re-route as the matching critical task type.
