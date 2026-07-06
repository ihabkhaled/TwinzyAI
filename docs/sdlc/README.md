# SDLC Baselines — Twinzy

These documents are the permanent delivery baselines for the Twinzy repository. They define the standing rules that every request-specific feature folder under `docs/features/` must inherit and follow.

They should be read as operating manuals, not short summaries. If a new recurring expectation appears in delivery, testing, release, security, QA, documentation, or support, it belongs in this folder and in the governance chain: [`CLAUDE.md`](../../CLAUDE.md) (compact mirror), [`AGENTS.md`](../../AGENTS.md) (canonical entry point), and the full rule bodies in [`rules/`](../../rules/README.md) — rules win all conflicts.

## Contents

| Document | Role |
| --- | --- |
| [`company-sdlc-policy.md`](./company-sdlc-policy.md) | The delivery operating model: phases `00`–`27`, gates, tracks, waivers |
| [`engineering-standards.md`](./engineering-standards.md) | Minimum engineering quality bar (summary; full bodies in `rules/`) |
| [`code-review-checklist.md`](./code-review-checklist.md) | Per-PR review checklist (pairs with `rules/23-review-checklist.md`) |
| [`security-baseline.md`](./security-baseline.md) | Security **and Twinzy privacy/AI-safety** floor for any shipped change |
| [`qa-baseline.md`](./qa-baseline.md) | Independent QA operating model |
| [`uat-baseline.md`](./uat-baseline.md) | Business/user acceptance validation model |
| [`risk-baseline.md`](./risk-baseline.md) | How risk is identified, documented, and accepted |
| [`release-checklist.md`](./release-checklist.md) | Minimum release gate for any deploy |
| [`documentation-baseline.md`](./documentation-baseline.md) | What documentation must change with the software |
| [`public-reference-points.md`](./public-reference-points.md) | Public engineering guidance that informs this rigor |

## The real quality gates

Every "done" claim in this repository is backed by the canonical commands (run from the repo root):

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck
npm run test:unit
npm run test:coverage   # statements/branches/functions/lines >= 95/90/95/95
npm run build
npm run security:scan   # trivy — 0 HIGH/CRITICAL findings
```

Husky enforces pre-commit, commit-msg (conventional commits), and pre-push hooks. Never bypass them with `--no-verify`.

## Related folders

- [`rules/`](../../rules/README.md) — full rule bodies, numbered `00`–`24`; the single source of truth
- [`testing/`](../../testing/README.md) — testing strategy, standards, coverage policy, quality gates
- [`agents/`](../../agents/README.md) — reviewer/gatekeeper agent definitions
- [`runbooks/`](../../runbooks/README.md) — operational procedures (outage, rollback, smoke tests)
- [`docs/features/`](../features/README.md) — one folder per request, phases `00`–`27`
- [`architecture/adrs/`](../../architecture/adrs/README.md) — architectural decision records
