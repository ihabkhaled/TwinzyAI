# Skill: Full Codebase Cleanup

Run a repo-wide simple-code sweep: find violations, fix by ownership, keep every gate green throughout. This is the orchestration skill; the per-file moves live in [simplify-existing-code.md](./simplify-existing-code.md).

## Read first

- [rules/28](../rules/28-simple-readable-code.md) · [29](../rules/29-reuse-before-creating.md) · [30](../rules/30-refactor-discipline.md)
- [memory/known-pitfalls.md](../memory/known-pitfalls.md) (K1–K5 especially)

## Steps

1. **Scan** — grep the sweep list: inline `const`/`type`/`interface`/as-const/`z.object`/`Record<` in layer files; magic strings (routes, statuses, keys, model names, TTLs, limits); `console.` / `process.env` outside sanctioned homes; nested ternaries; long files/functions/hooks/components; duplicates across shared/api/web. Run `npm run quality:dead-code` and `npm run quality:circular`.
2. **Triage** — for each finding record: file, kind, correct owner, severity. Drop taste-only findings; the lint config is the arbiter of style.
3. **Fix in ownership order** — backend → frontend → shared/scripts; one domain per slice; tests first when behavior shifts; focused suite after each slice.
4. **Safety-critical files** (upload chain, AI safety service, image handling, adapters) follow [cleanup-without-weakening-safety.md](./cleanup-without-weakening-safety.md) — behavior-identical, re-verified by their integration suites.
5. **Validate** — full gates (`lint · typecheck · test:coverage · build`, plus `test:e2e:ci` when the web changed); update docs that described the old shape; commit per slice.

## Checklist

- [ ] Sweep list fully executed; findings triaged with owners, not fixed ad hoc
- [ ] No new rules weakened to make the sweep pass; no test deleted to pass
- [ ] Dead code removed, duplicates consolidated, oversized units split by responsibility
- [ ] Gates green after every slice; docs match the refactored reality

Related: [prepare-agent-mirrors.md](./prepare-agent-mirrors.md) · [rules/23-review-checklist.md](../rules/23-review-checklist.md)
