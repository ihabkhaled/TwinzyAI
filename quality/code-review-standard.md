---
id: quality-code-review-standard
title: Code Review Standard
type: quality
authority: canonical
status: current
owner: repository owner
summary: Code review follows rules/23-review-checklist.md and docs/sdlc/code-review-checklist.md — behavior, architecture fit, test quality, and operational impact, with explicit blocker language.
keywords: [code-review, review, checklist, blocker, must-fix, pr, approval, standards]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs: [rules/23-review-checklist.md, docs/sdlc/code-review-checklist.md, agents/README.md]
readWhen: You are reviewing a change or preparing one for review.
---

# Code Review Standard

The checklist bodies are owned elsewhere — this doc routes:

- **Engineering checklist (wins on disagreement):**
  [rules/23-review-checklist.md](../rules/23-review-checklist.md).
- **SDLC per-PR checklist:** [docs/sdlc/code-review-checklist.md](../docs/sdlc/code-review-checklist.md)
  (pairs with rules/23 per [docs/sdlc/README.md](../docs/sdlc/README.md)).
- **Specialist reviewer roles** (architecture, security, performance, tests, database,
  reliability, release): [agents/README.md](../agents/README.md).

## Binding review rules (CLAUDE.md Code Review / PR Review Rules)

- Every change is reviewed by someone qualified to understand its impact; shared contracts,
  security, auth, money flow, or compliance changes require deeper review.
- Reviewers examine behavior, architecture fit, test quality, docs, and operational impact —
  not only style.
- Blocker language is explicit: `MUST FIX`, `SHOULD FIX`, `FOLLOW-UP`.
- Reviewers trace the change to its request ID and acceptance criteria, and verify tests cover
  the changed behavior rather than merely raising totals.
- Migrations, config, CI, health checks, runbooks, and release notes are checked as affected-or
  explicitly-not-applicable.
- Approvals never substitute for missing evidence; stale approvals on materially changed code
  do not count; unresolved blockers prevent merge.

## Repo-specific hard checks

- No inline ESLint suppression or ts-comment escape anywhere — reviewer rejection is mandatory
  (CLAUDE.md Non-Negotiable Gates).
- Product non-negotiables (free-by-default paywall lever, consent-first, extraction-only image
  boundary, no identity/sensitive inference, env-only models, no TS `enum`) are review-blocking
  regardless of who approved the ticket (CLAUDE.md Twinzy Product Constraints).
- PR packaging follows the CLAUDE.md Pull Request Packaging Rules (problem, scope, risk, test
  evidence, docs, rollout/rollback notes; screenshots for UI, contract diffs for APIs).

## Merge blocks

Do not merge on: undocumented scope drift, missing/failing tests, red coverage without a
recorded waiver ([waiver-register.md](waiver-register.md)), stale docs, missing approvals,
undefined rollback, or bypassed gates (CLAUDE.md Merge Rules).
