# Risk Baseline — Twinzy

## Purpose

This document defines how risk is identified, documented, reviewed, and accepted in the Twinzy repository.

## Risk Categories

- business risk
- player/customer risk
- technical risk
- security risk
- privacy risk (highest sensitivity in this product: image handling, trait wording, log leakage)
- AI-safety risk (identity claims, biometric framing, forbidden wording escaping the safety filter)
- external-provider risk (Gemini availability, quota, model behavior drift)
- operational risk
- compliance or legal risk
- reputational risk
- release risk

## Risk Handling Model

1. Identify the risk.
2. Describe trigger and impact.
3. Estimate likelihood and severity.
4. Define mitigation.
5. Define owner.
6. Define contingency or rollback.
7. Reassess before release.

## Risk Review Cadence

Risk should be reviewed at least during:

- intake (`00-intake.md`)
- delivery planning (`05-delivery-plan.md`)
- architecture review (`08-architecture-review.md`)
- security review when applicable (`19-security-review.md`, `19-threat-model.md`)
- go / no-go (`22-go-no-go.md`)
- retrospective for escaped issues (`27-retrospective.md`)

## Required Risk Fields

| Field | Description |
| --- | --- |
| Risk ID | Unique identifier |
| Description | Short statement of the risk |
| Trigger | What would cause the risk to occur |
| Impact | Business or technical consequence |
| Likelihood | Low, medium, high |
| Severity | Low, medium, high, critical |
| Mitigation | Preventive action |
| Contingency | What to do if it happens |
| Owner | Named person |
| Status | Open, mitigated, accepted, closed |

## Risk Acceptance

- Only authorized approvers may accept material risk.
- Accepted risk must be visible in go / no-go records.
- Time-bound or conditional acceptance is preferred over permanent acceptance.
- Privacy and AI-safety invariants (no image persistence, no biometrics, no identity claims) are not acceptable risks — they are hard stops.

## Common Risk Mistakes

- describing risk vaguely without trigger or impact
- assuming low likelihood means low importance
- forgetting operational and support risk while focusing only on technical risk
- treating external-provider outage as "not our problem" instead of designing the degraded path
- accepting risk with no owner or expiration
- treating rollback absence as a normal condition
