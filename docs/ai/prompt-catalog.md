---
id: ai-prompt-catalog
title: AI Prompt Catalog
type: doc
authority: canonical
status: current
owner: repository owner
summary: The four prompt files, their PromptKey, required placeholders, output schema, and shared safety constraints.
keywords: [ai, prompts, placeholders, promptkey, extraction, generation, judge, translation]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/prompts, apps/api/src/modules/ai/model/prompt-version.constants.ts, apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts]
relatedTests: [apps/api/src/modules/ai/tests/prompt-template.repository.test.ts, apps/api/src/modules/ai/tests/ai-pipeline.test.ts]
relatedDocs: [docs/ai/prompt-change-checklist.md, docs/ai/schema-contracts.md, docs/ai-safety.md]
readWhen: You are editing a prompt file, adding a placeholder, or need to know which prompt feeds which step.
---

# AI Prompt Catalog

All prompts live in `apps/api/src/modules/ai/prompts/` and are loaded by
[`infrastructure/prompt-template.repository.ts`](../../apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts):
file-backed, cached, verifies every required placeholder exists in the template, replaces via
split/join (no regex), and rejects any built prompt still containing ANY known placeholder before
it can reach a provider. The registry of keys, files, and placeholders is
[`model/prompt-version.constants.ts`](../../apps/api/src/modules/ai/model/prompt-version.constants.ts)
(`PromptKey`, `PROMPT_FILES`, `PromptPlaceholder`, `REQUIRED_PLACEHOLDERS`).

Contract version: `GAME_PROMPT_VERSION = 'written-traits-v5'`
(`packages/shared/src/constants/app.constants.ts:49`) — a Zod literal in every response schema, so
prompts and schemas move in lock-step (test:
`apps/api/src/modules/ai/tests/ai-pipeline.test.ts:94`, which lists every taxonomy field in the
prompt template).

## The four prompts

| File | PromptKey | Step | Required placeholders | Output schema |
| --- | --- | --- | --- | --- |
| `use-1st-prompt.md` | `trait-extraction` | Extraction | `[LANGUAGE_CODE]` | `TraitExtractionResponseSchema` (`packages/shared/src/schemas/traits.schema.ts`) |
| `use-2nd-prompt.md` | `candidate-generation` | Generation | `[TRAITS_JSON]`, `[LANGUAGE_CODE]`, `[RESULT_COUNT]`, `[REGION_HINT]` | `CandidateGenerationResponseSchema` (`candidates.schema.ts`) |
| `use-3rd-prompt.md` | `candidate-judge` | Judge | `[TRAITS_JSON]`, `[CANDIDATES_JSON]`, `[LANGUAGE_CODE]`, `[RESULT_COUNT]` | `CandidateJudgeResponseSchema` (`judge.schema.ts`) |
| `translate-result-prompt.md` | `translate-result` | Translation | `[RESULT_JSON]`, `[TARGET_LANGUAGE_CODE]` | `FinalGameResultSchema` (`game-result.schema.ts`) |

## What each prompt asks for

- **Prompt 1 (extraction)**: image + prompt → 16-category/221-field localized trait JSON plus
  matching aggregates (`compactTraitSummary` 20–35, `highSignalTraitTokens` 5–15,
  `weightedTraitEvidence` weights 1–10, `visualArchetypeHints`, `imageQualityCaps`
  clear/moderate/low/very-low, `candidateSearchHints`) and an all-false `safetyCheck`. Explicitly
  forbids identity/celebrity/face-recognition/biometric claims and
  age/ethnicity/personality/health/attractiveness/income guesses.
- **Prompt 2 (generation)**: written evidence → candidate pool sized `[RESULT_COUNT]`..25
  (target ≈ `min(max(2N, N+5), 25)`); region hint is coverage-only, never a constraint; each
  candidate needs ≥3 concrete trait justifications; shared 0–100 `styleVibeFitScore` rubric with
  honesty caps (low/very-low image quality ⇒ ≤79; few strong features ⇒ ≤74; 90+ needs ≥4 named
  agreements); explicit "Forbidden wording" list.
- **Prompt 3 (judge)**: evidence + pool → ≤`[RESULT_COUNT]` re-scored results
  (`finalStyleVibeFitScore`, verdict bands at 80/70, display-worthy needs score ≥70 +
  `meetsMinimumEvidence`), `removedCandidates` with reasons, localized fallback + disclaimer;
  same honesty caps and forbidden wording.
- **Prompt 4 (translation)**: existing result JSON → same-structure translation; names, numbers,
  and enums must not change; forbidden wording applies in any language.

When `AI_PARALLEL_PIPELINE_ENABLED=true`, the generation prompt gains an appended text-only
"## Lane focus (recall variation)" section per lane — a recall-bias directive (strongest / diverse
/ wildcard) that reaffirms every base-prompt safety and trait-support rule. The base prompt **file
is unchanged**; the focus directives are versioned constants in
`apps/api/src/modules/ai/model/candidate-lane.constants.ts`, so the flag-off path is byte-identical
and no `GAME_PROMPT_VERSION` bump is needed ([concurrency-policy.md](concurrency-policy.md)).

## Shared safety constraints

Every prompt carries a forbidden-wording section and an all-false `safetyCheck` self-report; the
server never trusts either alone — see [safety-filters.md](safety-filters.md) and the owning doc
[docs/ai-safety.md](../ai-safety.md). Server-owned copy (disclaimer, no-match fallback) is always
replaced from `RESULT_DISCLAIMER_BY_LANGUAGE` / `NO_MATCH_FALLBACK_BY_LANGUAGE`
(`packages/shared/src/constants/app.constants.ts`) regardless of what the model wrote.

Changing any prompt: follow [prompt-change-checklist.md](prompt-change-checklist.md).
