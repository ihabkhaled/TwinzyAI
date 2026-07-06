# 19 - Threat Model

## Purpose

Identify credible threats, abuse paths, and trust-boundary risks introduced or changed by this request.

## Scope

[Describe the system boundaries, entry points, actors, and assets relevant to this request.]

## Assets to Protect

Twinzy's standing assets (extend per request):

- the uploaded image bytes (in memory, request lifetime only)
- the privacy promise itself (no persistence, no biometrics, no identity claims)
- `GEMINI_API_KEY` and other secrets
- the integrity of the upload security chain and safety filter
- service availability of the analyze flow
- [Request-specific asset]

## Trust Boundaries

| Boundary | Why it matters |
| --- | --- |
| | |

## Threat Scenarios

| Threat ID | Scenario | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| | | | | |

## Abuse Cases

Standing examples for this product (extend per request):

- hostile or polyglot files smuggled past MIME/extension checks
- oversize payloads or upload floods against the expensive AI path
- crafted images attempting to steer AI output into forbidden identity wording
- attempts to extract provider internals or secrets via error responses
- [Request-specific abuse case]

## Security Assumptions

- [Assumption 1]

## Exit Checklist

- [ ] Assets identified
- [ ] Trust boundaries identified
- [ ] Threats listed
- [ ] Mitigations defined
- [ ] Residual risk visible

## Evidence And References To Attach

- architecture diagrams, data-flow references, or boundary references
- security assumptions or policy references
- linked abuse cases or prior incidents if relevant

## Phase Blockers

Do not close this phase if:

- important assets are unnamed
- trust boundaries are assumed but not written
- mitigations are vague or ownerless
- residual risk is hidden
