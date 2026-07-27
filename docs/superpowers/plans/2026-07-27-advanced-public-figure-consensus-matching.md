# Advanced Public-Figure Consensus Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver flag-gated, verified, backend-scored public-figure consensus matching with safe enrichment and accessible localized presentation.

**Architecture:** Extend shared and existing AI/game owners; add a bounded public-figures module; keep orchestration above focused services; expose only additive entity/enrichment data. The image remains extraction-only and all later stages are text-only.

**Tech Stack:** TypeScript, Zod, NestJS/Fastify, Next.js/React, Vitest, Playwright.

## Global Constraints

No biometrics, image comparison, identity claims, unsafe URLs, raw env reads, inline declarations, suppressions, `any`, non-null assertions, or provider disclosure. New flags default false. Tests precede behavior.

### Task 1: Shared matching contracts

**Files:** `packages/shared/src/{constants,enums,schemas,types}/`, extraction fixtures/tests.

- [ ] Add failing schema tests for bounded signals, profiles, counterfactuals, entity IDs, reports, consensus, enrichment, and attribution.
- [ ] Run shared tests and confirm contract failures.
- [ ] Add minimal constants/as-const values/schemas/exports and update prompt version.
- [ ] Run shared and affected AI tests.
- [ ] Commit a focused slice.

### Task 2: Profile and catalog retrieval

**Files:** AI profile builder/tests; `apps/api/src/modules/public-figures/`.

- [ ] Add failing classification, occlusion, counterfactual, lane, dedupe, and regional-coverage tests.
- [ ] Implement pure profile builder and bounded catalog repository/retrieval service.
- [ ] Verify locale is a recall hint only and every result has a reviewed entity ID.
- [ ] Run targeted unit tests and commit.

### Task 3: Ensemble, critique, consensus, second pass

**Files:** AI prompts/model/application/lib/config and game orchestration/tests.

- [ ] Add failing participant degradation, critique, median, penalty, quality-cap, and one-pass-guard tests.
- [ ] Add configured participant parsing and bounded text-only execution through current adapters/gate.
- [ ] Add prompts 4/5 and strict schemas; calculate scores in pure backend code.
- [ ] Prove one exaggerated model cannot dominate and client/provider isolation holds.
- [ ] Run AI/game unit and integration tests and commit.

### Task 4: Verified enrichment

**Files:** public-figures adapters/cache/use case/config/tests.

- [ ] Add failing allowlist, timeout/bytes/content/redirect, entity-resolution, summary/image mapping, TTL/capacity, and fallback tests.
- [ ] Implement entity-ID-only Wikidata/Wikipedia/Commons adapters and bounded cache.
- [ ] Add lazy details transport with strict DTO and safe errors.
- [ ] Run unit/integration/security tests and commit.

### Task 5: Result/share contracts and Arabic language validation

**Files:** shared result/share schemas; language guard/translation/game/share integration.

- [ ] Add failing additive contract, wrong-language Arabic, translation fallback, and no-image-payload tests.
- [ ] Implement content-aware language validation with explicit exclusions and revalidation.
- [ ] Aggregate optional enrichment without internal reports/providers.
- [ ] Run shared/API integration tests and commit.

### Task 6: Result card and accessible details dialog

**Files:** game components/containers/hooks/services/gateway/model/i18n/tests/E2E.

- [ ] Add failing semantic-node, BiDi, modal focus/Escape/restore, fallback, attribution, safe-link, mobile, and share tests.
- [ ] Implement small pure components, hook orchestration, verified-image UI, and lazy details loading.
- [ ] Add all locale keys, with Arabic rank label separated from values.
- [ ] Run web unit, accessibility, visual, and E2E tests and commit.

### Task 7: Metrics, benchmark, docs, and release evidence

**Files:** benchmark/metrics/config/docs/knowledge/release artifacts.

- [ ] Add synthetic written-profile benchmark fixtures and metric tests.
- [ ] Add payload-free structured metrics and feature flags.
- [ ] Update canonical docs/mirrors and rebuild generated knowledge.
- [ ] Run install, formatting, lint, typecheck, unit, coverage, integration, E2E CI, build, dead-code, circular, audits, security scans, validate, pre-commit, and pre-push.
- [ ] Push, open a ready PR, monitor GitHub checks, repair failures, and record exact evidence.

