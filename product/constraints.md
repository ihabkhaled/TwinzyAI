---
id: product-constraints
title: The Nine Product Constraints (Current Truth)
type: product
authority: canonical
status: current
owner: repository owner
summary: "The nine product-defining constraints as currently true — free by default with a recorded env-gated paywall exception, consent-first, no image persistence, no identity or sensitive inference, env-only models, zod+safety on every AI response, no TS enum, backend-verified uploads."
keywords: [constraints, non-negotiables, consent, privacy, safety, paywall, enum, uploads, env]
contextTier: 2
relatedCode: [apps/api/src/modules/file-security/application/file-security.service.ts, apps/api/src/modules/game/application/analyze-game.use-case.ts, packages/shared/src/constants/safety.constants.ts, apps/api/src/config/env.schema.ts]
relatedTests: [apps/web/e2e/game-privacy.spec.ts, apps/web/e2e/paywall.spec.ts]
relatedDocs: [CLAUDE.md, product/monetization-policy.md, docs/ai-safety.md, docs/file-upload-security.md]
readWhen: You are about to change anything that could touch a product-defining invariant.
---

# The Nine Product Constraints (Current Truth)

Governance owner: the "Twinzy Product Constraints" section of [CLAUDE.md](../CLAUDE.md).
Constraint 1 below reflects the owner-approved 2026-07-12 supersession recorded in
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)
(see [monetization-policy.md](monetization-policy.md)); the CLAUDE.md text predates that
decision. All enforcement claims below were verified against code on 2026-07-12.

## 1. Free by default; monetization only per the recorded program

The game is fully free with blank PayPal credentials — the shipped default: every payment
method no-ops ([apps/api/src/modules/payments/application/payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts);
[apps/web/e2e/paywall.spec.ts](../apps/web/e2e/paywall.spec.ts)). Two recorded exceptions
exist, both env-gated and both owned by [monetization-policy.md](monetization-policy.md):
the voluntary paypal.me donate link (GO 2026-07-10) and the PayPal Orders v2 paywall
(SANDBOX-GO 2026-07-12; **LIVE not approved**). The paypal.me link can never gate results —
payment through it is unverifiable
([docs/features/paypal-donations-and-paid-results/06-technical-refinement.md](../docs/features/paypal-donations-and-paid-results/06-technical-refinement.md)).

## 2. Consent-first

The photo is processed only after the explicit consent checkbox; the backend requires the
literal consent flag as the **first** check in the security chain
([apps/api/src/modules/file-security/application/file-security.service.ts](../apps/api/src/modules/file-security/application/file-security.service.ts),
[apps/api/src/modules/game/api/dto/analyze-request.dto.ts](../apps/api/src/modules/game/api/dto/analyze-request.dto.ts)).
The checkbox copy must accurately describe visible-trait extraction and text-only matching
([user-facing-copy-principles.md](user-facing-copy-principles.md)).

## 3. No image persistence or downstream image use

The image lives in request memory only (multer memory storage), is zero-filled in `finally` on
success, failure, and abort
([apps/api/src/modules/game/application/analyze-game.use-case.ts](../apps/api/src/modules/game/application/analyze-game.use-case.ts),
[apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts](../apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts)),
and is never logged, stored, or passed beyond trait extraction. Candidates, judge, translation,
share, and display are text-only by construction
([apps/api/src/modules/game/application/style-match.service.ts](../apps/api/src/modules/game/application/style-match.service.ts),
[docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)); ESLint forbids
image-capable provider calls outside the extraction service
([docs/eslint-architecture.md](../docs/eslint-architecture.md)).

## 4. No identification of the user

Twinzy never determines or asserts WHO anyone is — playful public style/vibe matches from
written visible traits only. The judge schema hard-fails identity, lookalike, biometric, and
face-recognition claims via `z.literal(false)` flags
([packages/shared/src/schemas/judge.schema.ts](../packages/shared/src/schemas/judge.schema.ts)).

## 5. No sensitive inference

No ethnicity/religion/health/sexuality/personality/attractiveness/income judgments, ever.
Enforced by the bilingual forbidden lists
([packages/shared/src/constants/safety.constants.ts](../packages/shared/src/constants/safety.constants.ts)),
the wording guard
([apps/api/src/modules/ai/lib/forbidden-wording.guard.ts](../apps/api/src/modules/ai/lib/forbidden-wording.guard.ts)),
and the safety service that rejects unsafe trait responses whole and drops unsafe
candidates/results item-wise
([apps/api/src/modules/ai/application/ai-safety.service.ts](../apps/api/src/modules/ai/application/ai-safety.service.ts)).

## 6. Models and operational caps come from env only

`GEMINI_MODEL`, per-step model chains, and multi-provider `AI_ROUTE_*` are all env-driven
([apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts)); an empty chain
throws `AiProviderUnavailable` instead of falling back to a hardcoded model
([apps/api/src/modules/ai/adapters/gemini.adapter.ts](../apps/api/src/modules/ai/adapters/gemini.adapter.ts)).
Env-var catalog: [docs/env-vars.md](../docs/env-vars.md).

## 7. Every AI response is Zod-validated and safety-filtered

All four pipeline steps (extraction, candidates, judge, translation) parse through strict
shared schemas and the safety filter before use ([docs/ai-safety.md](../docs/ai-safety.md)).
Even PayPal REST bodies are zod-parsed before trust
([apps/api/src/modules/payments/model/paypal.schemas.ts](../apps/api/src/modules/payments/model/paypal.schemas.ts)).

## 8. No TypeScript `enum` keyword

`as const` objects + derived types everywhere; mechanically banned via `no-restricted-syntax`
on `TSEnumDeclaration` ([eslint/typescript.config.mjs](../eslint/typescript.config.mjs)).

## 9. File uploads are backend-verified

Consent → presence → size → MIME/extension allowlists + consistency → magic bytes → structural
decode → optional ClamAV failing closed whenever enabled
([rules/15-file-upload-security.md](../rules/15-file-upload-security.md),
[apps/api/src/modules/file-security/application/virus-scan.service.ts](../apps/api/src/modules/file-security/application/virus-scan.service.ts);
behavior matrix in [TEST_CASES.md](../TEST_CASES.md)).
