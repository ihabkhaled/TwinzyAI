<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Prompt template wording/placeholders

Task type: `ai-prompt-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Prompts live in apps/api/src/modules/ai/prompts/ with validated REQUIRED_PLACEHOLDERS.
- Placeholder replacement is split/join (no regex) and asserts nothing unreplaced.
- Wording must never solicit identity, biometrics, or sensitive attributes.
- Output schema + safety filter changes accompany any output-shape change.

## Must-read docs

- docs/ai-safety.md — See rules/14-ai-safety.md for the normative rules. Implementation summary: (~644 tokens)
- context/ai-context.md — Pipeline (backend only; the frontend never calls an AI provider): (~252 tokens)

## Rules

- rules/14-ai-safety.md — > Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 43–46) · [15-file-upload-security.md](./15-file-upload-security.md) · [17-manager-layer.md](./17-manager-layer.md) (the analyze pipeline) · [26-error-handling-a... (~419 tokens)

## Skills

- skills/write-integration-tests.md

## Reviewers

- agents/backend-security-reviewer.md

## Code entrypoints

- `apps/api/src/modules/ai/prompts/`

## Validation before done

- `npm run test:ai`
- `npm run ai:benchmark`

## Notes

Test with npm run test:ai plus a benchmark run; judge safety flags (z.literal(false)) must stay impossible to satisfy with unsafe content.
