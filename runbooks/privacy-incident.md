---
id: runbook-privacy-incident
title: Runbook — Privacy Incident
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Handling suspected violations of the privacy promises — image persistence/leakage, identity-sounding output, or sensitive-inference wording — always SEV-1.
keywords: [runbook, privacy, incident, image, identity, wording, sev-1, ai-safety, leak]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/privacy/lib/log-redaction.helpers.ts,
    apps/api/src/modules/ai/application/ai-safety.service.ts,
    apps/api/src/modules/share-results/application/share-result-safety.service.ts,
  ]
relatedTests: [apps/api/src/modules/privacy/tests/log-redaction.helpers.test.ts, apps/api/src/modules/ai/tests/ai-safety.service.test.ts]
relatedDocs:
  [
    runbooks/accidental-image-exposure.md,
    support/privacy-and-data-handling.md,
    docs/ai-safety.md,
    docs/privacy-and-data-retention.md,
  ]
readWhen: Anything suggests a privacy promise was broken — treat the report as true until disproven.
---

# Runbook — Privacy Incident

The privacy promises are product-defining (CLAUDE.md Twinzy constraints #2–#5): consent-first, no image persistence or downstream image use, no identification, no sensitive inference. A suspected breach of any of them is **SEV-1** regardless of player count. Suspected image exposure has its own focused procedure: [accidental-image-exposure.md](./accidental-image-exposure.md).

## Incident classes

1. **Image handling breach** — image bytes suspected in logs, storage, responses, share payloads, or non-extraction AI calls → continue in [accidental-image-exposure.md](./accidental-image-exposure.md).
2. **Identity/biometric-sounding output** — a result reads as "this is who you are" / face recognition / lookalike assertion.
3. **Sensitive-inference wording** — ethnicity/religion/health/sexuality/personality/attractiveness/income judgments in output.
4. **Copy breach** — deployed user-facing copy contradicting the pipeline (consent text, privacy page, or free/paid claims — cf. the recorded paywall copy condition, [`../support/known-issues.md`](../support/known-issues.md) KI-1).

## Prerequisites

- Exact evidence captured: the verbatim wording/screenshot, timestamp, language (en/ar), and request id if available ([`../support/evidence-collection.md`](../support/evidence-collection.md)). Never collect the player's photo.

## Steps

### For wording incidents (classes 2–3)

1. Preserve evidence; reproduce **only in a non-production environment**.
2. Determine how it passed the guards: every AI response is zod-validated then swept for forbidden wording (`AiSafetyService`, `apps/api/src/modules/ai/application/ai-safety.service.ts` over `packages/shared/src/constants/safety.constants.ts`); judged results additionally carry literal-false safety flags (`docs/ai-safety.md`). A miss means the forbidden lists or filters have a gap.
3. Contain: if a recent prompt/model/route change correlates, revert it ([rollback.md](./rollback.md)); a model behaving badly can be pinned away per [ai-schema-failures.md](./ai-schema-failures.md).
4. Fix the filter gap in `packages/shared` safety constants / the safety service **with a regression test reproducing the exact phrase class**; this is a security-review-gated change (rules/14).
5. If the wording reached a **shared** page, delete that share record (`DELETE /api/v1/share-results/:shareId` is idempotent) — share ingest re-scans wording, so a leak there implies the same filter gap (`share-result-safety.service.ts`).

### For copy breaches (class 4)

1. Identify the copy source (`apps/web/src/packages/i18n/messages/{en,ar}.json` or backend message constants) and when it shipped.
2. If the deployment configuration makes the copy false (e.g. paywall enabled with "completely free" copy), the fastest containment is the **env lever**: disable the contradicting feature until copy is fixed (blank PayPal credentials = free game).
3. Copy fixes ship through the normal gates in both languages together.

### Always

- Support gets a known-issue entry + approved wording ([`../support/communication-templates.md`](../support/communication-templates.md) T7).
- Blameless postmortem (`27-postmortem.md`) — privacy incidents always qualify as serious.

## Verify

- Regression test for the exact failure mode is green and part of the suite.
- Re-run the safety-relevant suites: `npm run test:ai` and `npm run test:security` (root `package.json`).
- No recurrence in logs over the hypercare window ([hypercare.md](./hypercare.md)).

## Rollback

Reverts and env levers per [rollback.md](./rollback.md). Never "roll back" a safety filter to restore output quality — filters only ever tighten (CLAUDE.md: forbidden-wording rejection is a product constraint).
