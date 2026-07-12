<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Investigating/fixing a production defect

Task type: `production-bug` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Reproduce before fixing; the root cause, not the symptom, gets the fix.
- The exact failure mode becomes a permanent regression test.
- Check memory/known-pitfalls.md first — many failures are recorded traps.

## Must-read docs

- memory/known-pitfalls.md — > The running log of recurring mistakes and their fixes. **Read before writing code.** These (~7621 tokens)
- docs/architecture.md — npm-workspaces monorepo: (~1486 tokens)

## Rules

- rules/22-observability-logging.md — > How Twinzy stays diagnosable without ever leaking what it exists to protect: the **AppLogger port only** (never `console.*`), structured logs at correct levels, a request id flowing through every line, and redaction that treats image d... (~1429 tokens)
- rules/26-error-handling-and-exceptions.md — > Every failure is a **typed `AppError`** carrying a `messageKey`, raised in the layer that detects it and translated **once** at the edge by the global exception filter into the sanitized envelope. Full detail is logged server-side; cli... (~1656 tokens)

## Skills

- skills/investigate-production-bug.md

## Reviewers

- agents/reliability-engineer.md
- agents/observability-reviewer.md

## Validation before done

- `npm run test:integration`
- `npm run test:e2e:ci`

## Notes

Evidence order: user-visible error → error code → owning module (impact graph) → logs (redaction-aware) → recent commits touching the owner.
