# UAT Baseline — Twinzy

## Purpose

UAT confirms that the delivered change solves the real problem in realistic usage: a player picks a photo on a phone, understands the consent step, gets a playful style/vibe result, and never encounters wording that sounds like face recognition.

## UAT Principles

- UAT is not a duplicate of engineering tests.
- UAT should be executed by the product owner, sponsor, or people close to real players — not the implementing engineer.
- UAT must validate language, workflow fit, clarity, correctness, and tone (playful, never biometric).

## UAT Scenario Design Rules

- use real workflows rather than synthetic isolated clicks — the full upload → traits → match journey on a real device
- include at least one normal case, one edge case (odd lighting, unusual photo), and one failure or recovery case (declined consent, oversize photo, AI unavailable)
- test language, wording, and product meaning, not only system response — the disclaimer, the trait descriptions, the match copy
- confirm the result is understandable and comfortable for a non-technical player

## Minimum UAT Questions

- Does the change solve the original pain point?
- Is the flow understandable without engineering interpretation?
- Are instructions, labels, and outputs clear?
- Does every visible string respect the product promise (no identity claims, no "you look exactly like X")?
- Do error states read as friendly guidance, not technical noise?
- Are edge cases meaningful in real usage?

## UAT Output

- scenario list
- executed steps
- observed result
- expected result
- pass or fail
- feedback and change requests
- final sign-off status (recorded in `20-uat-report.md`)

## UAT Evidence Expectations

UAT should leave behind:

- named participants
- date of execution
- exact scenarios run
- observed fit issues (wording, tone, flow friction)
- decisions on whether issues are blockers, polish, or follow-up work

## UAT Exit Rule

No release where product value or wording safety is still uncertain for a player-facing change.

## UAT Failure Signals

UAT has failed as a discipline when:

- participants cannot explain what was being validated
- the team treats UAT as a rubber stamp after engineering sign-off
- wording, tone, and privacy-promise correctness are ignored
- issues are found but never routed back into change control
