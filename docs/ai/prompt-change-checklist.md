---
id: ai-prompt-change-checklist
title: Prompt Change Checklist
type: doc
authority: canonical
status: current
owner: repository owner
summary: Actionable checklist for editing a prompt file or its placeholders — lock-step schema/taxonomy rules, safety review, tests, benchmark, docs.
keywords: [ai, checklist, prompt, placeholders, schema, taxonomy, safety, version]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/prompts, apps/api/src/modules/ai/model/prompt-version.constants.ts, packages/shared/src/constants/trait-category.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-pipeline.test.ts, apps/api/src/modules/ai/tests/prompt-template.repository.test.ts]
relatedDocs: [docs/ai/prompt-catalog.md, docs/ai/schema-contracts.md, docs/ai-safety.md]
readWhen: You are about to edit any file under apps/api/src/modules/ai/prompts or the placeholder registry.
---

# Prompt Change Checklist

Prompts are load-bearing safety and contract surfaces ([prompt-catalog.md](prompt-catalog.md)).
A prompt edit is critical-lane work: the safety wording, the schema contract, and the taxonomy
move in lock-step.

## Before editing

- [ ] Read [docs/ai-safety.md](../ai-safety.md) and the prompt's row in
      [prompt-catalog.md](prompt-catalog.md); know which schema validates its output
      ([schema-contracts.md](schema-contracts.md)).
- [ ] Never remove or weaken: the forbidden-wording section, the all-false `safetyCheck`
      self-report, the honesty caps, or the identity/sensitive-inference prohibitions —
      weakening any of these requires an owner-recorded decision (`CLAUDE.md` constraints #4/#5).

## Structural rules

- [ ] Placeholders: if you add/remove one, update `PromptPlaceholder` and
      `REQUIRED_PLACEHOLDERS` in
      [`prompt-version.constants.ts`](../../apps/api/src/modules/ai/model/prompt-version.constants.ts)
      and the step service that builds the prompt. The loader fails if a required placeholder is
      missing from the template or left unreplaced — rely on that, don't bypass it.
- [ ] Output shape: any change to what the prompt asks the model to return MUST land in the
      same change as the shared Zod schema update
      (`packages/shared/src/schemas/…`) — otherwise every response becomes
      `AI_RESPONSE_INVALID` at runtime.
- [ ] Taxonomy: extraction trait fields are single-sourced in
      `packages/shared/src/constants/trait-category.constants.ts`; the lock-step test
      (`ai-pipeline.test.ts:94`) fails if prompt and taxonomy diverge — change the constant, not
      just the prompt text.
- [ ] Contract version: a breaking output-contract change means bumping
      `GAME_PROMPT_VERSION` (`packages/shared/src/constants/app.constants.ts:49`), which is a
      Zod literal in every response schema — prompts, schemas, and fixtures must move together.
- [ ] Both languages: prompts instruct localized output (en/ar); keep localization instructions
      and any language-specific examples consistent for both.

## Validate

- [ ] `npm run test:ai` — must include the lock-step test and
      `prompt-template.repository.test.ts`.
- [ ] `npm run ai:benchmark` (mock first; `--mode=real` if wording changed enough to shift model
      behavior) — watch the schema-validity and safety axes
      ([benchmark-methodology.md](benchmark-methodology.md)).
- [ ] `npm run calibrate` with real photos to check end-to-end quality did not regress
      ([evaluation-framework.md](evaluation-framework.md) Leg 3); record written conclusions.
- [ ] Safety review pass over the diff: no new wording that could elicit identity or sensitive
      inference ([prompt-injection-threat-model.md](prompt-injection-threat-model.md)).
- [ ] Full gates: `npm run lint` · `npm run typecheck` · `npm run test:coverage` ·
      `npm run build`.

## Document

- [ ] Update [prompt-catalog.md](prompt-catalog.md) (placeholders/outputs table) and
      [docs/ai-safety.md](../ai-safety.md) if safety-relevant behavior changed.
- [ ] Rebuild the knowledge plane: `npm run knowledge:build`
      ([knowledge/README.md](../../knowledge/README.md)).
