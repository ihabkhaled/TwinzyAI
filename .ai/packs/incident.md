<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Live incident response

Task type: `incident` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Blameless; timeline recorded as it happens in incidents/active/.
- User-data safety first — never widen logging to debug a privacy path.
- Every incident ends with a postmortem and a learnings entry.

## Must-read docs

- runbooks/README.md — Index of all operational runbooks for the Twinzy stack — development, deployment, incidents, providers, performance, and safety procedures. (~1173 tokens)
- memory/known-pitfalls.md — > The running log of recurring mistakes and their fixes. **Read before writing code.** These (~7621 tokens)

## Rules

- rules/22-observability-logging.md — > How Twinzy stays diagnosable without ever leaking what it exists to protect: the **AppLogger port only** (never `console.*`), structured logs at correct levels, a request id flowing through every line, and redaction that treats image d... (~1429 tokens)
- rules/24-release-gate.md — > The final go/no-go. Everything below must pass, in order, before any release. Never mark skipped tests as passed. Never release with a weakened rule. Never bypass a hook. (~577 tokens)

## Skills

- skills/investigate-production-bug.md

## Reviewers

- agents/reliability-engineer.md

## Code entrypoints

- `incidents/`

## Validation before done

- `npm run test:integration`

## Notes

Triage order: /health → provider status (outage runbook) → recent release (rollback runbook) → known pitfalls.
