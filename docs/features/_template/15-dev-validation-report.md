# 15 - Developer Validation Report

## Purpose

Record the implementation team's proof that the change works before independent QA takes over.

## Validation Summary

| Area | Result | Evidence |
| --- | --- | --- |
| Lint (`npm run lint`, 0 errors / 0 warnings) | pass / fail | |
| Type checks (`npm run typecheck`) | pass / fail | |
| Unit tests (`npm run test:unit`) | pass / fail | |
| Integration tests (`npm run test:integration`) | pass / fail | |
| Coverage (`npm run test:coverage`, ≥ 95/90/95/95) | pass / fail | |
| Build (`npm run build`) | pass / fail | |
| Security scan (`npm run security:scan`, 0 HIGH/CRITICAL) | pass / fail | |
| E2E tests (`npm run test:e2e`) | pass / fail / n-a | |
| Manual validation | pass / fail | |

## Step-by-Step Validation Log

1. [Command or activity]
2. [Command or activity]
3. [Command or activity]

## Functional Coverage

| Function / route / component / job / state transition | What was tested | Result |
| --- | --- | --- |
| | | |

## Operational Validation

- Logs checked (structured entries, request-id present, nothing sensitive leaked):
- Error envelopes checked (correct status, error code, message key):
- In-memory state and non-persistence checked (no image bytes written anywhere):
- External integration checked (AI provider call or stub behavior):

## Acceptance Criteria Validation

| Acceptance criterion | Validation method | Result |
| --- | --- | --- |
| | | |

## Defects Found During Developer Validation

- [Defect 1]

## Exit Checklist

- [ ] Automation completed
- [ ] Manual validation completed
- [ ] Acceptance criteria checked
- [ ] Evidence recorded
- [ ] Defects handed to phase `16`

## Evidence And References To Attach

- command outputs or summarized results
- screenshots or recordings when useful
- logs, traces, state verification notes, or query results where relevant

## Phase Blockers

Do not close this phase if:

- validation was claimed but not evidenced
- writes or state transitions were not verified
- acceptance criteria were not checked explicitly
- known defects were discovered but not logged
