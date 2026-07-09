# 03-product-requirements.md — TwinzyAI Hardening v3

## Epics and user stories

1. **Result-count control**
   - As a user, I can choose how many style/vibe results I want (1–10) so I control the output density.
   - Default is 10.
2. **Calibrated, evidence-based scoring**
   - As a user, I see scores that reflect visible-trait alignment only, not identity confidence.
   - Scores below 90 are explained clearly; 90+ requires strong visible evidence.
3. **Richer, non-identifying trait extraction**
   - As a user, I get matches that feel more specific because the model extracts more visible signals (hair, beard, brows, eyes, smile, lighting, pose, accessories, etc.) without identifying me.
4. **Trust and safety**
   - As a user, I never see identity, biometric, exact-lookalike, or sensitive-inference claims.
   - As a user, my uploaded image is never stored or returned.
5. **Quality gates**
   - As an engineer, all custom ESLint rules, magic-number enforcement, and expanded test suites pass before merge.

## Acceptance criteria

- [ ] Result-count dropdown on upload screen defaults to 10 and allows 1–10.
- [ ] Frontend validates result count and sends it with analyze and analyze-stream requests.
- [ ] Backend validates result count (integer, 1–10, default 10 if omitted for compatibility).
- [ ] Prompts consume the requested count and candidate generation produces a pool larger than N when safe.
- [ ] Judge returns up to N final results, sorted descending, with calibrated scores.
- [ ] Aggregation enforces requested count, injects disclaimer, and caps uncertain scores.
- [ ] Translation preserves canonical names, scores, ranks, and result count.
- [ ] No prompt or UI copy contains identity/recognition/biometric/exact-lookalike language.
- [ ] All 13 frontend architecture ESLint rules have RuleTester tests.
- [ ] `@typescript-eslint/no-magic-numbers` is enabled in production code.
- [ ] Playwright covers the 35+ required scenarios including mobile devices, cancel, streaming stages, translation, and file boundaries.
- [ ] All validation gates pass with evidence.

## In scope

- Result-count feature end-to-end (shared, backend, frontend, prompts).
- Prompt vNext rewrite and version bump.
- Score calibration and uncertainty handling.
- Shared schema hardening (trait count, safety check, error envelope, duplicate removal).
- Backend DTO, use-case, service, aggregation, and translation updates.
- Frontend UI, hooks, services, gateways, i18n, and error-state updates.
- ESLint RuleTester tests for frontend and missing backend rules.
- Magic-number enforcement.
- Expanded Vitest and Playwright coverage.
- Security scan verification and dependency audit.
- Documentation updates (README, SECURITY, TEST_CASES, runbooks, governance docs).

## Out of scope / non-goals

- No payments, subscriptions, or monetization.
- No face recognition, identity matching, biometric comparison, or exact-lookalike claims.
- No image persistence, embeddings, or templates.
- No new languages beyond English and Arabic.
- No queue-based async processing or multi-process/cluster implementation unless profiling proves it is needed.
- No new third-party AI providers.

## UX expectations

- Upload CTA is playful and clearly states the privacy promise.
- Result-count dropdown has a localized label: “How many style/vibe results do you want?”
- Streaming progress shows stages: validating image, checking safety, scanning file, extracting traits, generating candidates, judging, preparing results.
- Result cards show score, reason, aligned traits, mismatch warnings, uncertainty notes, and disclaimer.
- Errors are friendly, specific, and explain what happened and what the user can do.

## Error states

- Consent missing, no file, multiple files, unsupported MIME/extension, MIME mismatch, magic-byte mismatch, decode failure, oversized file, virus scanner unavailable, virus detected, model timeout, malformed JSON, safety rejection, no credible candidates, translation failure, rate limit, network failure, cancellation.

## Permissions and analytics

- No new permissions or roles.
- No new analytics events required beyond existing pipeline stage logs.

## Localization

- All user-facing strings route through i18n dictionaries.
- Arabic RTL layout is preserved.
- Result-count options are numbers and do not need translation; labels do.

## Product definition of done

- Feature works in English and Arabic on mobile and desktop.
- Scores are calibrated and never inflated to satisfy UI expectations.
- No forbidden wording in prompts or outputs.
- All required tests pass and docs are updated.
