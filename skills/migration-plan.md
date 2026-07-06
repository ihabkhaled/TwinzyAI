# Skill: Plan a Schema Migration

> Status: not applicable today — Twinzy has no database by standing decision
> (memory/architecture-decisions.md). This is the binding planning pattern the moment
> persistence is approved via ADR; authoring the migration itself happens in
> add-migration-backfill.md. The plan is written and reviewed BEFORE any DDL exists.

1. Classify the change: additive (new nullable column/table/index — safe) vs breaking
   (rename, drop, type-narrow, `NOT NULL` on populated data). Breaking changes are split
   into expand -> migrate -> contract phases; never one big-bang migration.
2. Write the compatibility matrix: which app versions run against the in-between schema
   during rollout — the old release is still serving traffic mid-deploy, and both old and
   new code must work at every phase.
3. Sequence the phases with a rollback note per phase: expand and migrate are reversible
   (drop the new shape, flip reads back); contract is NOT data-reversible — name the backup
   taken before it runs and the restore path.
4. Design the backfill: batch size constant, stable cursor, resume behavior, and the
   verification assertion (`remaining === 0`) that must pass before reads switch.
5. Name the observability per phase: progress logs via `AppLogger`, failure/timeout states,
   and the abort path.
6. Record the plan and the decision in memory/architecture-decisions.md before writing any
   DDL, and review it like code.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
