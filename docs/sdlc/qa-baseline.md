# QA Baseline — Twinzy

## Purpose

This document defines the minimum QA operating model for independent validation in the Twinzy repository. It pairs with the testing standards in [`testing/`](../../testing/README.md) and the test-case templates in [`test-cases/`](../../test-cases/unit/unit-test-case-template.md).

## QA Expectations

- QA works from documented requirements, acceptance criteria, architecture notes, and the test strategy (`11-test-strategy.md`).
- QA is independent from implementation validation (phase `17` vs phase `15`), even when the same person wears both hats — different session, different evidence.
- QA validates both specified behavior and risky real-world behavior (odd photos, hostile files, provider outages).
- QA evidence must be traceable to the request ID.

## QA Preparation Checklist

Before QA starts, the following should be available:

- request summary
- acceptance criteria
- test strategy
- a running environment (`docker compose up --build` or `npm run dev`)
- fixture images (see `apps/api/src/tests/fixtures/` and [`testing/test-data-and-fixtures.md`](../../testing/test-data-and-fixtures.md)) — never real people's photos in committed fixtures
- known risks
- known limitations
- expected rollout audience and behavior

## Minimum QA Coverage

- happy paths (upload → traits → match result)
- unhappy paths (missing consent 400, oversize 413, wrong type, hostile file, AI unavailable 502)
- edge cases and boundary cases (size exactly at the cap, unusual but valid images)
- regression scope
- consent-flow cases (Twinzy has no auth or roles; consent is the permission boundary)
- input validation (zod at every trust boundary)
- workflow continuity across web → API → AI provider
- user-visible content and error states (i18n copy, disclaimer wording, forbidden-wording absence)

## QA Inputs

- product requirements
- acceptance criteria
- delivery plan
- architecture review
- test strategy
- fixture data
- environment notes
- known risks and open limitations

## QA Outputs

- defects with reproducible steps
- severity and priority
- evidence
- environment
- pass or fail status by scenario
- final QA sign-off or rejection (recorded in `17-qa-report.md`)

## QA Evidence Expectations

QA evidence should be concrete enough that another person could understand what was actually exercised:

- scenario identifiers
- executed steps
- observed results
- screenshots or recordings when useful
- request or response samples when useful (never containing image bytes)
- linked defects for failures

## QA Exit Rule

QA sign-off requires all blockers resolved or explicitly accepted by authorized approvers with documented risk.

## QA Failure Signals

QA is being treated weakly when:

- only happy paths are tested
- defects are reported without repro steps
- test data is improvised and undocumented
- failures are marked "probably environmental" with no follow-up
- retests happen without updating evidence
- automated equivalents (`*.test.ts`, `*.integration.test.ts`, Playwright e2e) exist but were never run against the change
