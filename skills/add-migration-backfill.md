# Skill: Add a Migration / Backfill

> Status: not applicable today — Twinzy has no database by standing decision
> (memory/architecture-decisions.md): nothing is persisted, privacy by design. Images,
> embeddings, and biometric data may NEVER be persisted regardless of any future storage.
> This is the binding playbook the moment persistence is introduced via ADR.

1. Plan first with migration-plan.md (expand -> migrate -> contract); no breaking step may
   land while old code still runs.
2. Every migration ships a real `up()` AND a `down()` that fully reverses it; a `DROP` is
   flagged as not data-reversible with a named backup and restore path.
3. Additive-first: add the nullable column -> backfill -> tighten (`NOT NULL`, constraints)
   in a LATER migration, after proving no violations remain.
4. Backfills are chunked and resumable: advance by a stable cursor (never offsets, which
   shift under writes), commit per bounded batch, log progress via `AppLogger`, and bind
   every value — zero string interpolation (injection-safety-review.md).
5. Keep the entity/model and repository in sync in the same change; index every new
   FK/filter/sort column in the same migration file.
6. Verify persisted state — loop exit is not proof: assert `remaining === 0` and reconcile
   before any read path switches to the new shape.
7. Tests: `up()`/`down()` round-trip, idempotent double-run (second pass processes zero
   rows), resume mid-run without double-processing, and batch-boundary edge cases.
8. Never edit an already-applied migration — ship an additive corrective one. Record schema
   decisions in memory/architecture-decisions.md.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
