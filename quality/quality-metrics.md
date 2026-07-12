---
id: quality-quality-metrics
title: Quality Metrics
type: quality
authority: canonical
status: current
owner: repository owner
summary: What quality is measured by today — coverage vs thresholds, test counts, lint zero-warning, scanner findings, benchmark scores — and the last recorded values with dates.
keywords: [metrics, coverage, thresholds, test-counts, lint, trivy, benchmark, measurement, evidence]
contextTier: 2
relatedCode: [package.json]
relatedTests: []
relatedDocs: [testing/coverage-policy.md, docs/final-validation-report.md, quality/quality-model.md]
readWhen: You need current quality numbers, or you are recording new measured values after a validation run.
---

# Quality Metrics

What is measured, the target, and the **last recorded value** (with its date and source —
values here are evidence snapshots, not live numbers; re-measure with the commands in
[quality-model.md](quality-model.md)).

## Measured metrics and targets

| Metric | Target | Last recorded value | Source |
| --- | --- | --- | --- |
| Coverage (statements/branches/functions/lines) | ≥ 95/90/95/95 on touched modules ([testing/coverage-policy.md](../testing/coverage-policy.md)) | 99.05 / 97.14 / 100 / 99.03 (2026-07-06 @ d7efd51) | [docs/final-validation-report.md](../docs/final-validation-report.md) |
| Frontend pure-logic coverage | 100% for utils/helpers/mappers/schemas/query-key builders | gating status recorded in the policy doc | [testing/frontend/coverage-policy.md](../testing/frontend/coverage-policy.md) |
| Unit/integration test count | all green, none skipped | 642/643 unit with clean re-run (hardening v3, dev validation); 254/254 (2026-07-06 full validation); 491 tests at the v2 doc sweep | [docs/features/twinzy-hardening-v3/15-dev-validation-report.md](../docs/features/twinzy-hardening-v3/15-dev-validation-report.md), [docs/final-validation-report.md](../docs/final-validation-report.md) |
| E2E (Playwright) | all green vs mocked BFF | 11/11 (2026-07-06) | [docs/final-validation-report.md](../docs/final-validation-report.md) |
| Lint | 0 errors, 0 warnings (`--max-warnings 0`) | 0/0 (2026-07-06) | same |
| Typecheck | 0 errors | 0 (2026-07-06) | same |
| Dependency/vuln scan | no advisories (`audit-level=low`); Trivy 0 HIGH/CRITICAL | clean; multer CVE-2026-5079 remediated | same |
| AI route quality (offline) | weighted score: schema 0.5 / safety 0.3 / speed 0.2, per route entry | produced per run under `benchmark-results/` (gitignored — no committed baseline) | [docs/ai-benchmarking.md](../docs/ai-benchmarking.md), [apps/api/src/benchmark/lib/benchmark-metrics.util.ts](../apps/api/src/benchmark/lib/benchmark-metrics.util.ts) |

## Interpretation rules

- Thresholds are floors on **touched modules**, not repo averages; scenario depth beats
  percentage (CLAUDE.md Coverage Rules; [test-review-standard.md](test-review-standard.md)).
- A metric only counts with recorded evidence (command output in a validation report — CLAUDE.md
  Required Evidence Types). Update this table when a new validation report lands.

## Not measured today (honest gaps)

- Runtime SLIs/SLOs — no metrics pipeline ([operations/SLIs.md](../operations/SLIs.md),
  [operations/SLOs.md](../operations/SLOs.md)).
- Defect-escape rate / MTTR — no incidents recorded yet
  ([incidents/learnings-index.yaml](../incidents/learnings-index.yaml)).
- Review turnaround / PR cycle time — not tracked anywhere in the repo.
