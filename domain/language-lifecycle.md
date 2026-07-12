---
id: domain-language-lifecycle
title: Language Lifecycle — Codes, Echo Guard, Canonical-Field Restore
type: domain
authority: canonical
status: current
owner: repository owner
summary: How language flows through the domain — en/ar codes, lenient analyze normalization vs strict translate rejection, the response-language echo guard, and translation's canonical-field restoration.
keywords: [language, i18n, en, ar, normalization, translation, echo-guard, canonical-fields, rtl, localization]
contextTier: 2
relatedCode: [packages/shared/src/constants/language.constants.ts, apps/api/src/modules/ai/lib/response-language.guard.ts, apps/api/src/modules/ai/application/result-translation.service.ts, apps/api/src/modules/game/lib/request-language.ts]
relatedTests: [apps/api/src/modules/game/tests/request-language.test.ts, apps/api/src/tests/game-translate-result.integration.test.ts]
relatedDocs: [domain/invariants.md, domain/result-ranking.md, rules/12-i18n.md]
readWhen: You are touching language codes, translation, localized server copy, or anything that depends on the response language.
---

# Language Lifecycle — Codes, Echo Guard, Canonical-Field Restore

## Supported codes

`LANGUAGE_CODES = ['en', 'ar']`, `DEFAULT_LANGUAGE_CODE = 'en'` — single source
`packages/shared/src/constants/language.constants.ts`; strict schema
`LanguageCodeSchema = z.enum(LANGUAGE_CODES)`
(`packages/shared/src/schemas/language.schema.ts`).

Static UI copy is the frontend i18n's job (en+ar with RTL — owned by
[rules/12-i18n.md](../rules/12-i18n.md)); this doc covers the **dynamic AI output** language.

## Two intake policies, deliberately different

- **Analyze normalizes leniently.** The multipart `languageCode` is free-form at the
  transport edge (max 35 chars) and whatever arrived — absent, junk, unsupported — is
  normalized to a supported code with the shared default
  (`apps/api/src/modules/game/lib/request-language.ts`;
  `normalizeLanguageCode` in `language.constants.ts`; rationale in
  `apps/api/src/modules/game/api/dto/analyze-request.dto.ts` doc comment).
- **Translate rejects strictly.** `TranslateResultRequestSchema` uses the strict enum, so an
  unsupported `targetLanguageCode` is a 400, not a silent default
  (`packages/shared/src/schemas/translate-result.schema.ts`;
  `language.constants.ts` doc comment records the split).

## The response-language echo guard

Every AI pipeline response must carry a `languageCode` equal to the requested one;
a mismatch rejects the response as `AI_RESPONSE_INVALID`
(`apps/api/src/modules/ai/lib/response-language.guard.ts`, used by the step services). The
model cannot silently answer in the wrong language.

## Language-dependent behavior inside the pipeline

- **Region hint**: the generation prompt receives a coverage-only region hint keyed by the
  chosen language (`apps/api/src/modules/ai/model/region-hint.constants.ts`) — see
  [policies.md](policies.md#region-hint-policy).
- **Server-owned localized copy**: the disclaimer and no-match fallback are always
  `RESULT_DISCLAIMER_BY_LANGUAGE[languageCode]` / `NO_MATCH_FALLBACK_BY_LANGUAGE[languageCode]`
  (`packages/shared/src/constants/app.constants.ts`) — enforced per
  [invariants.md](invariants.md#2-the-disclaimer-is-server-set-never-model-trusted).
- **Trait keys never localize**: taxonomy keys stay English camelCase; only values are
  localized (`packages/shared/src/constants/trait-category.constants.ts`).

## Translation re-imposes every canonical field

`apps/api/src/modules/ai/application/result-translation.service.ts` — the model's output
"only survives in localized text positions" (doc comment, lines 80–84):

1. The translated JSON is Zod-validated against `FinalGameResultSchema` (line 71).
2. **Shape drift is rejected**: added/removed/reordered results or summary entries fail
   `hasSameJsonShape` (`assertSameShape`, lines 105–109;
   `apps/api/src/modules/ai/lib/json-shape.util.ts`).
3. **Names may not change or reorder** (`preserveResults`, lines 111–122).
4. Canonical fields are restored from the original (`preserveCanonicalFields`, lines 85–103;
   `preserveResultItem`, lines 125–139): `promptVersion`, `resultCount`, `traitCount`, and per
   item `name`, `rank`, `finalStyleVibeFitScore`, `confidenceLevel`, `verdict`,
   `publicCategory`, `safetyCheck`.
5. The `disclaimer` and `fallbackMessage` are replaced with the **target-language server
   constants** (lines 99–102) — never the model's translation of them.
6. All translated text is safety-filtered (`assertTranslatedTextSafe`, lines 141–149) —
   forbidden wording in any language rejects the whole translation
   ([safety-boundaries.md](safety-boundaries.md)).

Net effect: translating a result can change only localized prose; scores, ranking, verdicts,
identity-safety guarantees, and the served copy stay exactly as originally delivered.
