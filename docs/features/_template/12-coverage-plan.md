# 12 - Coverage Plan

## Purpose

Define the measurable coverage gate for touched modules and guard against coverage theater.

## Policy

- Enforced gate: `npm run test:coverage` — statements ≥ 95%, branches ≥ 90%, functions ≥ 95%, lines ≥ 95% (Vitest fails the run below threshold)
- Touched modules aim higher than the floor; critical logic must be near-complete and scenario-rich
- Global repository average is not an acceptable substitute for weak touched-module coverage
- Full policy and waiver process: `testing/coverage-policy.md`

## Touched Module Coverage Targets

| Module / area | Statements | Branches | Functions | Lines | Notes |
| --- | --- | --- | --- | --- | --- |
| | ≥ 95% | ≥ 90% | ≥ 95% | ≥ 95% | |

## Critical Scenario Areas

- consent handling and validation order
- upload security chain (size, MIME, extension, magic bytes, decode, ClamAV fail-closed)
- AI response zod validation and forbidden-wording safety filtering
- privacy-sensitive logic (no image persistence, log redaction)
- error envelope mapping (every error code and status path)
- external integration error handling (Gemini timeout, 5xx, malformed responses)
- data transformations (traits → candidates → result)
- business rules of the match/judge flow

## Coverage Evidence Plan

- Tooling used: Vitest coverage (`npm run test:coverage`)
- Report location: `coverage/`
- How touched modules will be identified: git diff of the request's slices
- How branch gaps will be reviewed: per-file coverage report for every touched module

## Waiver Section

| Field | Value |
| --- | --- |
| Waiver needed | yes / no |
| Reason | |
| Compensating controls | |
| Approver | |
| Expiration date | |

## Exit Checklist

- [ ] Coverage thresholds defined
- [ ] Touched modules listed
- [ ] Critical scenario areas called out
- [ ] Waiver status documented

## Evidence And References To Attach

- coverage command or tooling reference
- report location
- touched-module identification method
- waiver approval reference if needed

## Phase Blockers

Do not close this phase if:

- coverage is described only as a repo-wide average
- critical scenario areas are not explicitly called out
- a waiver is needed but has no approver or expiration date
