<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Trait extraction / candidates / judge / translation behavior

Task type: `ai-pipeline-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Only TraitExtractionService may receive the image; every other step is text-only by construction.
- Every step output is zod-parsed then safety-filtered before use.
- The server, never the model, sets disclaimers and canonical fields.
- Prompt/schema/safety changes ride the critical lane with test:ai green.

## Must-read docs

- context/ai-context.md — Pipeline (backend only; the frontend never calls an AI provider): (~400 tokens)
- docs/ai-safety.md — See rules/14-ai-safety.md for the normative rules. Implementation summary: (~644 tokens)
- docs/provider-routing.md — TwinzyAI routes each AI pipeline step (trait **extraction**, candidate **generation**, **judge**, result **translation**) through a provider-agnostic router, so every step can run on the provider/model that fits its difficulty — with cro... (~1253 tokens)

## Rules

- rules/14-ai-safety.md — > Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 43–46) · [15-file-upload-security.md](./15-file-upload-security.md) · [17-manager-layer.md](./17-manager-layer.md) (the analyze pipeline) · [26-error-handling-a... (~419 tokens)
- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)

## Skills

- skills/add-ai-provider.md
- skills/write-integration-tests.md

## Reviewers

- agents/backend-security-reviewer.md
- agents/backend-test-engineer.md

## Code entrypoints

- `apps/api/src/modules/ai/`
- `apps/api/src/modules/result-aggregation/`

## Validation before done

- `npm run test:ai`
- `npm run lint`
- `npm run typecheck`

## Notes

The pipeline: extraction → candidate generation → judge → aggregation → (translation). Read docs/ai/pipeline.md and the step service before editing. Language guard and shape checks are load-bearing — never bypass on "trusted" paths.
