---
id: quality-risk-register
title: Risk Register
type: quality
authority: canonical
status: current
owner: repository owner
summary: Open product and operational risks with recorded mitigations — paywall LIVE conditions, AI provider outage, prompt/schema drift, single-instance state loss, and refund failure.
keywords: [risk, register, paywall, provider-outage, prompt-drift, mitigation, single-instance, refunds]
contextTier: 2
relatedCode: [apps/api/src/modules/payments/adapters/paypal.adapter.ts, apps/api/src/modules/ai/adapters/ai-router.service.ts]
relatedTests: [apps/api/src/tests/game-analyze-paywall.integration.test.ts]
relatedDocs: [docs/sdlc/risk-baseline.md, docs/security-threat-model.md, quality/technical-debt-register.md]
readWhen: You are assessing a change's risk, planning a release, or reviewing whether a known risk is already owned.
---

# Risk Register

Risk methodology is owned by [docs/sdlc/risk-baseline.md](../docs/sdlc/risk-baseline.md);
security threats by [docs/security-threat-model.md](../docs/security-threat-model.md) and the
paywall threat model. This register holds the durable, cross-feature risks. All items verified
2026-07-12. Owner for all: repository owner.

| ID | Risk | Mitigation in place | Residual / status |
| --- | --- | --- | --- |
| R-001 | **Premature paywall LIVE** — charging real users before the 4 recorded conditions are met (HTTPS origin, live credentials after sandbox sign-off, en+ar copy revision, live smoke + refund) would ship unverifiable promises and untruthful copy. | Decision of record is SANDBOX-GO only; default-blank credentials keep the game free; conditions listed in [docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md) | OPEN until all 4 conditions recorded as met |
| R-002 | **AI provider outage or quota exhaustion** — analyze flow fails with 429/502; the product has a single default provider (Gemini) unless routes are configured. | Model-chain + route fallback with typed exhaustion ([operations/retry-budget.md](../operations/retry-budget.md)); runbook [runbooks/ai-provider-outage.md](../runbooks/ai-provider-outage.md); per-call and per-run deadlines ([operations/timeout-budget.md](../operations/timeout-budget.md)) | Accepted for a free game; fallback providers are opt-in via env ([docs/provider-routing.md](../docs/provider-routing.md)) |
| R-003 | **Prompt/schema drift** — a prompt edit or provider behavior change breaks the zod contracts or weakens safety filtering. | Schema/prompt lock-step drift test and forbidden-wording sweep ([docs/ai-safety.md](../docs/ai-safety.md)); every response zod-validated; benchmark harness re-scores routes with production validators ([docs/ai-benchmarking.md](../docs/ai-benchmarking.md)) | Mitigated; doc-level version-wording inconsistency tracked as TD-005 in [technical-debt-register.md](technical-debt-register.md) |
| R-004 | **Unsafe wording escapes** — output reading as identity/biometric/sensitive inference would break the core product promise. | Shared forbidden lists + AiSafetyService on every free-text leaf; judge `z.literal(false)` safety flags; share ingest re-scans ([docs/ai-safety.md](../docs/ai-safety.md), [docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md)); support treats it as SEV-1 ([support/README.md](../support/README.md)) | Mitigated, monitored via support escalation |
| R-005 | **Single-instance state loss / accidental scale-out** — restarts drop in-flight runs and share links; running two replicas silently breaks caps, cancel, and shares. | Recorded single-process design + deferral decision ([architecture/adrs/adr-003-horizontal-scaling-plan.md](../architecture/adrs/adr-003-horizontal-scaling-plan.md), [operations/scaling-model.md](../operations/scaling-model.md)) | Accepted at current scale; do not scale out without ADR-003's plan |
| R-006 | **Paid-but-undelivered with failed refund** — post-capture failure triggers a best-effort refund; if the refund call also fails, a user has paid without a result. | Auto-refund on failure; refund failure logs `REFUND FAILED … reconcile in the PayPal dashboard` for manual action ([apps/api/src/modules/payments/application/payment-gate.service.ts](../apps/api/src/modules/payments/application/payment-gate.service.ts)); no webhooks yet (TD-001) | OPEN while paywall is enabled anywhere; manual reconciliation is the backstop |
| R-007 | **No alerting** — failures are only visible in logs/healthchecks nobody is paged for. | Honest posture recorded ([operations/availability-expectations.md](../operations/availability-expectations.md), [operations/observability-map.md](../operations/observability-map.md)) | Accepted for hobby scale; must be revisited before paywall LIVE (R-001) |

## Register rules

- Every risk has an owner and a status (OPEN / mitigated / accepted); acceptance is explicit,
  never silent (CLAUDE.md phase 24).
- Feature-scoped risks live in the feature folder's artifacts; only durable cross-feature risks
  live here.
- Realized risks become incidents ([incidents/README.md](../incidents/README.md)) and are
  re-assessed here on closure.
