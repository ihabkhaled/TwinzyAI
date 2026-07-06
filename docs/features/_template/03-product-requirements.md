# 03 - Product Requirements

## Purpose

Translate business intent into testable product requirements.

## Step-by-Step Workflow

1. Define epics and user stories.
2. Write acceptance criteria in observable terms.
3. Define scope boundaries and non-goals.
4. Document UX, permissions, analytics, notification, localization, and error-state expectations.
5. Define product-level definition of done.

## Epics

| Epic ID | Epic title | Outcome |
| --- | --- | --- |
| | | |

## User Stories

| Story ID | As a | I want | So that |
| --- | --- | --- | --- |
| | | | |

## Acceptance Criteria

| Story ID | Acceptance criterion | Priority |
| --- | --- | --- |
| | | |

## Scope Boundaries

### In scope

- [Item 1]

### Out of scope

- [Item 1]

## Non-Goals

- [Non-goal 1]

## UX Expectations

[Describe key flows, states, messaging, accessibility expectations, and any content or navigation constraints.]

## Error States

[Define how the system should behave on validation failures, upload rejections (consent, size, type, scan), AI provider failures/timeouts, empty states, and partial failure conditions. Errors surface through the `ApiErrorResponse` envelope and friendly i18n copy.]

## Permission Model Expectations

[Twinzy has no accounts, roles, or auth — every surface is public. Define instead: what requires explicit consent, what is rate-limited, and what must never be exposed (image bytes, provider internals). If a request appears to need auth, escalate — it likely violates a product invariant.]

## Localization / Content Expectations

[All user-facing strings go through i18n (`apps/web/src/i18n`). Define wording constraints here — playful style/vibe language only; no identity, biometric, or "exact lookalike" phrasing anywhere in copy.]

## Analytics / Notification Expectations

[Define events, dashboards, reports, notifications, and operational visibility expected from the feature.]

## Product Definition of Done

- [ ] User stories satisfied
- [ ] Acceptance criteria met
- [ ] Out-of-scope items remain out of scope
- [ ] Error handling defined
- [ ] Permissions defined
- [ ] Analytics expectations defined

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product owner | | approve / revise | |

## Evidence And References To Attach

- story sources, mockups, flow diagrams, or content references
- policy references for permissions, compliance, or workflow rules
- analytics event or reporting expectations if applicable

## Phase Blockers

Do not close this phase if:

- acceptance criteria are vague, untestable, or subjective
- non-goals are missing
- error states are missing
- permission behavior is assumed instead of written
- definition of done exists only in engineering terms
