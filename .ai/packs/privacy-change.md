<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Image lifecycle, consent, redaction, data handling

Task type: `privacy-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- The image never leaves request memory, is wiped in finally, and is never logged.
- Log redaction (privacy module) wraps every provider error before logging.
- No new persistence of user data without an owner-approved recorded decision.
- Consent copy must stay accurate to the pipeline in BOTH languages.

## Must-read docs

- docs/privacy-and-data-retention.md — - Uploaded image: retained ONLY in process memory for the duration of one request; wiped in (~611 tokens)
- docs/ai-safety.md — See rules/14-ai-safety.md for the normative rules. Implementation summary: (~644 tokens)

## Rules

- rules/14-ai-safety.md — > Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rules 43–46) · [15-file-upload-security.md](./15-file-upload-security.md) · [17-manager-layer.md](./17-manager-layer.md) (the analyze pipeline) · [26-error-handling-a... (~419 tokens)
- rules/06-security.md — > The house standard for securing a privacy-first, anonymous, stateless product. Twinzy has **no accounts, no auth, no database** — the attack surface is the upload pipeline, the AI boundary, and the HTTP edge. Implements rules 30–35 of ... (~1519 tokens)
- rules/22-observability-logging.md — > How Twinzy stays diagnosable without ever leaking what it exists to protect: the **AppLogger port only** (never `console.*`), structured logs at correct levels, a request id flowing through every line, and redaction that treats image d... (~1429 tokens)

## Skills

- skills/security-review.md
- skills/cleanup-without-weakening-safety.md

## Reviewers

- agents/backend-security-reviewer.md

## Code entrypoints

- `apps/api/src/modules/privacy/`
- `apps/api/src/modules/game/lib/`

## Validation before done

- `npm run test:security`
- `npm run test:coverage`

## Notes

domain/image-lifecycle.md is the canonical lifecycle statement. Any change to what is collected, kept, or logged updates docs/privacy-and-data-retention.md and the consent copy review in the same stream.
