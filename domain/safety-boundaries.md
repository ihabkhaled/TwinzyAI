---
id: domain-safety-boundaries
title: Safety Boundaries — The Four Enforcement Layers
type: domain
authority: canonical
status: current
owner: repository owner
summary: The four mechanically enforced AI-safety layers — shared forbidden lists, the wording guard, the AiSafetyService reject/drop policy, and literal-false schema flags — with docs/ai-safety.md as detail owner.
keywords: [safety, forbidden-wording, identity, sensitive-inference, literal-false, filter, guard, boundaries, bilingual]
contextTier: 2
relatedCode: [packages/shared/src/constants/safety.constants.ts, apps/api/src/modules/ai/lib/forbidden-wording.guard.ts, apps/api/src/modules/ai/application/ai-safety.service.ts, packages/shared/src/schemas/judge.schema.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-safety.service.test.ts, apps/api/src/modules/ai/tests/forbidden-wording.guard.test.ts]
relatedDocs: [docs/ai-safety.md, rules/14-ai-safety.md, domain/image-lifecycle.md]
readWhen: You are changing AI output handling, wordlists, safety flags, or anything user-visible produced by a model.
---

# Safety Boundaries — The Four Enforcement Layers

The product promise (`CLAUDE.md`, Twinzy constraints #4–#5, #7): no identification of the
user, no sensitive inference, every AI response validated and safety-filtered.
**Detail owner:** [docs/ai-safety.md](../docs/ai-safety.md) (implementation walk-through) and
[rules/14-ai-safety.md](../rules/14-ai-safety.md) (normative rules). This doc names the four
enforcement layers and their owning files — nothing more.

## Layer 1 — Shared forbidden lists (the vocabulary)

`packages/shared/src/constants/safety.constants.ts`:

- `FORBIDDEN_RESULT_PHRASES` — 33 bilingual (en+ar) identity/biometric phrasings ("face
  recognition", "identity match", "biometric", "exact lookalike", "you are ", "we
  identified", plus Arabic equivalents).
- `FORBIDDEN_SENSITIVE_TOPICS` — 33 bilingual sensitive-inference topics (ethnicity,
  religion, health, sexuality, attractiveness, income, age estimates, plus Arabic
  equivalents).

Single source for backend rejection AND the frontend never-renders tests. The share module
consumes the same lists (`apps/api/src/modules/share-results/model/share-safety.constants.ts`).

## Layer 2 — The wording guard (the scanner)

`apps/api/src/modules/ai/lib/forbidden-wording.guard.ts` — case-insensitive substring scan
over `ALL_FORBIDDEN_PHRASES` (the two lists merged in
`apps/api/src/modules/ai/model/ai-safety.constants.ts`); `findForbiddenPhrase` for
diagnostics. Extraction sweeps **every free-text leaf** — all 221 trait values, uncertainty
notes, summaries, tokens, hints (`apps/api/src/modules/ai/lib/trait-text.util.ts`).

## Layer 3 — The enforcement policy (reject vs degrade)

`apps/api/src/modules/ai/application/ai-safety.service.ts`:

- trait-extraction and translation text: any hit rejects the **whole response**
  (`AI_RESPONSE_UNSAFE`; only the matched phrase is logged);
- candidates and judged results: the offending **item is dropped**, the pipeline degrades
  gracefully to the fallback result if nothing safe remains.

Policy rationale: [policies.md](policies.md#safety-filter-policy).

## Layer 4 — Schema-level literal-false flags (the hard fail)

Every AI response must self-report all safety claims as `z.literal(false)`; a model asserting
any claim `true` fails Zod validation outright — before filtering even runs:

- `TraitSafetyCheckSchema` — 5 flags (`packages/shared/src/schemas/traits.schema.ts`);
- `CandidateSafetyCheckSchema` — 4 flags (`candidates.schema.ts`);
- `JudgeSafetyCheckSchema` — 5 flags + `meetsMinimumEvidence: z.boolean()`
  (`judge.schema.ts`, lines 34–40); `FinalResultSafetyCheckSchema` derives from it
  (`game-result.schema.ts`).

## Supporting boundaries (owned elsewhere)

- **Typed image boundary** — the photo physically cannot reach steps 2–5:
  [image-lifecycle.md](image-lifecycle.md).
- **Prompt-level instructions** — explicit forbidden-wording sections and all-false
  self-report requirements in all four prompts (`apps/api/src/modules/ai/prompts/`);
  see [docs/ai-safety.md](../docs/ai-safety.md).
- **Server-owned copy** — disclaimer/fallback are never model text:
  [invariants.md](invariants.md#2-the-disclaimer-is-server-set-never-model-trusted).
- **Display gate** — weak/low-evidence results never render:
  [result-ranking.md](result-ranking.md).
- **Language echo guard** — wrong-language responses are rejected:
  [language-lifecycle.md](language-lifecycle.md).
- **Share re-validation** — shared payloads are re-scanned as untrusted input:
  [sharing-lifecycle.md](sharing-lifecycle.md).
