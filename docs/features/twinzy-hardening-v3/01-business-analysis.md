# 01-business-analysis.md — TwinzyAI Hardening v3

## Problem statement

TwinzyAI’s current pipeline is safe but the result quality is not precise enough. The score can feel forced, the result count is locked at 5, the prompts do not extract the full set of visible style/vibe signals, and the test/lint/security gates have gaps that prevent a credible production-readiness claim. Without this hardening, the product cannot reliably deliver playful, evidence-based style/vibe matches while preserving privacy.

## Stakeholders and affected groups

- **End users** want richer, more accurate, playful results and control over how many results they see.
- **QA** needs real e2e coverage of mobile, Arabic, streaming, cancel, translation, and file-boundary flows.
- **Security** needs the secret scanner to actually detect secrets and the AI safety guard to be fully tested.
- **Engineering** needs magic values, duplicated contracts, and untested architecture rules to be mechanically enforced.
- **Operations** needs observability and scaling guidance documented before load increases.

## Current state

- Result count is hardcoded to 5.
- Scores are not calibrated to uncertainty or image quality; UI expectations can pressure inflation.
- Prompts are at v2; trait taxonomy is good but not deep enough.
- Frontend architecture rules are not self-tested; magic numbers are not enforced.
- Playwright coverage is thin and lacks mobile browser projects, cancel, streaming stages, and visual regression.
- Trivy did not detect a plaintext `GEMINI_API_KEY` in `.env`.

## Desired state

- User can select 1–10 results; default is 10.
- Scores are calibrated evidence of style/vibe fit only; 90+ is rare and explained.
- Prompts are at v3 with deeper visible-trait taxonomy and better uncertainty handling.
- All custom ESLint rules have RuleTester tests; magic numbers are enforced.
- Playwright covers the required 35+ business scenarios.
- Security scan reliably detects secrets and dependency vulnerabilities.

## Business goals and success metrics

- Result-count feature used in >80% of analyze sessions within 30 days.
- No user-facing identity/recognition/biometric claims.
- All validation gates (lint, typecheck, unit, integration, coverage, build, security:scan) pass.
- Touched-module coverage meets 95/90/95/95.
- Zero critical/high security findings unaddressed.

## Assumptions and dependencies

- Google Gemini remains the AI provider; model name comes from `GEMINI_MODEL` in `.env`.
- The `.env` key is accepted as a local-dev risk for now; rotation is recommended before any production exposure.
- The user base remains mobile-first, English/Arabic bilingual.
- No payment, identity, or biometric features are ever added.

## Risks of not doing the work

- Users perceive results as generic or overconfident, reducing trust.
- Competitors or reviewers can claim the product makes recognition/identity claims.
- Untested architecture rules and unenforced magic numbers create silent regressions.
- Security gaps (secret detection, dependency vulnerabilities) could become incidents.
