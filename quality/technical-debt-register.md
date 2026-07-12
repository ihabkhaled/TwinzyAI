---
id: quality-technical-debt-register
title: Technical Debt Register
type: quality
authority: canonical
status: current
owner: repository owner
summary: The recorded, owner-visible technical debt — stale legacy docs, the paywall artifact and webhook gaps, pending en+ar copy revision, and small code-level staleness.
keywords: [technical-debt, register, stale-docs, paywall, webhooks, i18n, mirrors, backlog]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts]
relatedTests: []
relatedDocs: [quality/risk-register.md, docs/features/paypal-donations-and-paid-results/22-go-no-go.md, knowledge/freshness-policy.yaml]
readWhen: You are planning cleanup work, or checking whether a known gap is already recorded before filing it again.
---

# Technical Debt Register

Debt is acceptable only when recorded here with an owner-visible exit path (CLAUDE.md: never
hide missing work behind vague wording). Risks that could cause harm (vs. cost) live in
[risk-register.md](risk-register.md). All items verified 2026-07-12.

| ID | Debt | Evidence | Exit path |
| --- | --- | --- | --- |
| TD-001 | **Paywall webhook reconciliation not implemented.** Capture-at-consumption is correct without it, but the threat model recommends webhooks before high volume; go/no-go records them as optional hardening. | [docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md](../docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md), [22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md) | Implement webhook reconciliation before any high-volume LIVE operation |
| TD-002 | **Paywall artifact-trail gap.** The feature folder holds a compressed trail (intake, technical refinement, threat models, go/no-go, sandbox verification) rather than the full 00–27 set required by [docs/features/README.md](../docs/features/README.md). | Folder contents of [docs/features/paypal-donations-and-paid-results/](../docs/features/paypal-donations-and-paid-results/00-intake.md) | Backfill the missing phase artifacts before LIVE go-live |
| TD-003 | **en+ar consent/privacy/disclaimer copy revision pending.** The app still states "free / anonymous / no persistence"; revised copy in both languages is LIVE condition 3 and must never contradict the pipeline (consent-first constraint). | [22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md) condition 3 | Owner-signed copy revision in en + ar before charging anyone |
| TD-004 | **Stale legacy docs lag current product truth** (the debt the knowledge OS is fixing): [docs/product-overview.md](../docs/product-overview.md) (15 traits / 4 matches / "no payments"), [docs/architecture.md](../docs/architecture.md) (`MAX_FINAL_RESULTS=5`), [docs/agent-code-map.md](../docs/agent-code-map.md) (`game.manager.ts`, `features/game` paths), [docs/agent-product-map.md](../docs/agent-product-map.md) ("up to 4", "no upsells"), [docs/release-checklist.md](../docs/release-checklist.md) item 9 ("no payment code") | Contradicted by [README.md](../README.md) (221 fields, 1–10 results), [docs/backend-architecture.md](../docs/backend-architecture.md) (Manager tier retired), and the recorded payments program | Rewrite or retire each doc; freshness triggers in [knowledge/freshness-policy.yaml](../knowledge/freshness-policy.yaml) then keep them honest |
| TD-005 | **Prompt-version wording spans docs inconsistently**: [TEST_CASES.md](../TEST_CASES.md) uses `advanced-global-traits-v3` while [docs/ai-safety.md](../docs/ai-safety.md) mentions `written-traits-v5` and the Simple Code OS release report a "prompt v5 contract". | The three cited docs | Single-source the prompt version story from the shared constant (`GAME_PROMPT_VERSION`) and align the docs |
| TD-006 | **Stale schema comment**: `env.schema.ts` lines ~153–158 describe "Vision capability declarations" env vars that do not exist; the fail-closed image policy actually lives in `AI_IMAGE_STEPS`. | [apps/api/src/config/env.schema.ts](../apps/api/src/config/env.schema.ts), [apps/api/src/config/gemini-step.constants.ts](../apps/api/src/config/gemini-step.constants.ts) | Delete/correct the comment in the next config-touching change |
| TD-007 | **Compressed artifact trails on shipped streams**: `multi-provider-ai` lacks 15/23 artifacts; `twinzy-hardening-v3` lacks 17/20/22/25. Code shipped and is documented, but the trails are thinner than the template demands. | [docs/features/multi-provider-ai/00-intake.md](../docs/features/multi-provider-ai/00-intake.md), [docs/features/twinzy-hardening-v3/00-intake.md](../docs/features/twinzy-hardening-v3/00-intake.md) | Backfill or record explicit owner acceptance of the compressed trails |

## Register rules

- One row per debt; link evidence, never restate it.
- Paying off an item = remove the row in the same PR as the fix, citing it.
- New durable gaps found in review go here, not into PR comments that get lost.
