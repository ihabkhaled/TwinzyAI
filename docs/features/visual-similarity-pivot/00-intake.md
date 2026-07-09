# 00 - Request Intake and Classification

## Request Record

| Field | Value |
| --- | --- |
| Request ID | `TWZ-2026-VISUAL-SIM` |
| Feature slug | `visual-similarity-pivot` |
| Request title | Product pivot to consent-first visual-similarity lookalike matching + accuracy program + hardening/performance/QA overhaul |
| Request type | product pivot + enhancement program |
| Request source | **Product owner, in writing, 2026-07-09** ("no it is okay to make recognition") — the owner explicitly relaxed the former "text-only after extraction / no facial-similarity" constraints |
| Technical owner | AI delivery agent |
| Delivery track | standard, sliced A–L (see the mega-prompt in the owner's prompts folder) |

## Owner approval record (policy exception → policy revision)

The former product constraints stated "No face recognition… written traits only"
and "Only the trait-extraction prompt sees the image", and `claude.md` requires an
authorized approver to record any exception in writing. The product owner did so on
**2026-07-09**: after the agent surfaced the conflict explicitly (behavior would
contradict the app's own "not face recognition" promises), the owner confirmed the
pivot. Consequence: `claude.md`'s Twinzy Product Constraints section was REVISED
(not bypassed) in this delivery stream, and all user-facing promises are updated to
match the new behavior (truthful-copy slice). This artifact is the written record.

## What changes / what can still never change

**Changes**: the user's photo may be provided to all three pipeline steps
(extraction, candidate generation, judging); graded resemblance language is allowed
in output; prompts optimize for genuine lookalike accuracy.

**Still non-negotiable**: free game · consent-first with truthful copy · zero image
persistence (memory-only, wiped in `finally` incl. abort paths, never
logged/stored/embedded/returned; stores hold ids only) · no identification of the
user · no sensitive inference · Zod validation + safety filtering of every AI
response · env-driven models/caps · no TS `enum` · backend-verified uploads.

## Compliance note (reviewed at intake)

Face-similarity processing is biometric-adjacent (GDPR special-category data; US
state biometric statutes such as BIPA). Mitigations in-product: explicit informed
consent before processing; zero retention (stated on the privacy page); processing
purpose limited to entertainment-grade resemblance; no identification. The
truthful-copy slice updates privacy/terms/consent copy accordingly; the security
review artifact re-checks this after implementation.

## Criticality

| Item | Answer |
| --- | --- |
| Severity | High (product-defining behavior + policy change) |
| Player-facing | yes (copy, accuracy, UX) |
| Privacy impact | yes — reviewed above; zero-persistence unchanged and re-proven with abort-path tests |
| AI behavior impact | yes — all prompts revised; calibration round gates the outcome |

## Exit checklist

- [x] Owner approval recorded in writing (this artifact + CLAUDE.md revision note)
- [x] New non-negotiables enumerated
- [x] Compliance reviewed at intake
- [x] Delivery slices defined (mega-prompt §0–§11; todo slices A–L)
