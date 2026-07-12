---
id: product-privacy-promises
title: Privacy Promises and Their Enforcement
type: product
authority: canonical
status: current
owner: repository owner
summary: "Each user-facing privacy promise Twinzy makes, where it is stated, and the exact code that enforces it — plus the one recorded caveat tied to the paywall going live."
keywords: [privacy, promises, consent, image, persistence, share, retention, enforcement, dsr]
contextTier: 2
relatedCode: [apps/api/src/modules/game/application/analyze-game.use-case.ts, apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts, apps/web/src/packages/i18n/messages/en.json]
relatedTests: [apps/web/e2e/game-privacy.spec.ts, apps/web/src/tests/pwa.test.ts]
relatedDocs: [docs/privacy-and-data-retention.md, SECURITY.md, product/constraints.md]
readWhen: You are changing copy, the pipeline, or storage and must not break a stated privacy promise.
---

# Privacy Promises and Their Enforcement

The retention posture is owned by
[docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md) and
[SECURITY.md](../SECURITY.md); this file maps each **user-facing promise** to its enforcement.
Every user-visible promise below appears in the i18n catalogs
([apps/web/src/packages/i18n/messages/en.json](../apps/web/src/packages/i18n/messages/en.json),
[ar.json](../apps/web/src/packages/i18n/messages/ar.json)) and/or the `/privacy` page
([apps/web/src/modules/game/components/privacy-notice.component.tsx](../apps/web/src/modules/game/components/privacy-notice.component.tsx)).

## The consent copy is the master promise

> "I agree that my photo is processed in memory only to extract visible traits. Matching then
> uses the written traits only, and my photo is never stored."
> — consent checkbox, [en.json](../apps/web/src/packages/i18n/messages/en.json) (Arabic parity in ar.json)

Verified accurate against the pipeline on 2026-07-12 (see [constraints.md](constraints.md) #2–3).

## Promise → enforcement map

| Promise | Enforced by |
| --- | --- |
| Photo processed **in memory only, never stored** | Multer memory storage; buffer zero-filled in `finally` on success/failure/abort ([analyze-game.use-case.ts](../apps/api/src/modules/game/application/analyze-game.use-case.ts), [analyze-game-stream.use-case.ts](../apps/api/src/modules/game/application/analyze-game-stream.use-case.ts), [upload-buffer-cleanup.util.ts](../apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts)); no upload volumes in Docker ([SECURITY.md](../SECURITY.md)) |
| Photo used **only to extract visible traits**; matching is text-only | Type-level image boundary — only [trait-extraction.service.ts](../apps/api/src/modules/ai/application/trait-extraction.service.ts) may call image-capable provider methods, ESLint-enforced ([docs/eslint-architecture.md](../docs/eslint-architecture.md)); [style-match.service.ts](../apps/api/src/modules/game/application/style-match.service.ts) receives text only |
| Photo **never in the browser's storage** either | The upload is an in-memory `File` + object URL ([useImageUpload.hook.ts](../apps/web/src/modules/game/hooks/useImageUpload.hook.ts)); checked on device in [docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md) |
| **Never identifies you; no biometrics** | Four safety layers + server disclaimer ([constraints.md](constraints.md) #4–5, [docs/ai-safety.md](../docs/ai-safety.md)); wording asserted in [apps/web/src/tests/pwa.test.ts](../apps/web/src/tests/pwa.test.ts) |
| **Nothing stored server-side; no accounts** | Stateless API, no database ([runbooks/README.md](../runbooks/README.md)); nothing to delete for DSRs ([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)) |
| Share links are **temporary and unguessable** | UUID keys, in-memory TTL cache (max 1h), identical safe 404 for missing/expired, visible countdown ([share-result.constants.ts](../packages/shared/src/constants/share-result.constants.ts), [docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)) |
| **No image can enter** share or translation | Share ingest re-runs the safety filter and rejects `data:`/base64 strings; translate is text-only by construction ([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)) |
| Photo **never re-sent on language switch** | Locale switch calls the text-only translate endpoint ([game-translate.gateway.ts](../apps/web/src/modules/game/gateway/game-translate.gateway.ts)) |
| **No secrets/PII in logs** | Extraction logs trait counts only; log redaction reviewed in [docs/security-review-report.md](../docs/security-review-report.md) |

## Recorded caveat (open, owner-tracked)

The catalogs still say the game is "completely free" and "we never ask for payment details".
That is truthful **only while the paywall is off — the shipped default**. Revising the consent,
privacy, and disclaimer copy in both languages is LIVE condition 3 of the recorded paywall
decision and must happen before any real charging
([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md);
see [monetization-policy.md](monetization-policy.md) and
[user-facing-copy-principles.md](user-facing-copy-principles.md)). Even with the paywall on,
Twinzy itself stores no payment records — PayPal processes them
([apps/api/src/modules/payments/model/payment.types.ts](../apps/api/src/modules/payments/model/payment.types.ts)).
