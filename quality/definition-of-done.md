---
id: quality-definition-of-done
title: Definition of Done
type: quality
authority: canonical
status: current
owner: repository owner
summary: Work is done only when the CLAUDE.md Definition Of Done holds — gates green, tests adequate to risk, docs updated, release and rollback ready, sign-offs recorded.
keywords: [definition-of-done, done, completion, gates, evidence, sign-off, validation]
contextTier: 2
relatedCode: [package.json]
relatedTests: []
relatedDocs: [testing/quality-gates.md, docs/sdlc/README.md, quality/quality-model.md]
readWhen: You are about to declare a change complete.
---

# Definition of Done

Owned by CLAUDE.md ("Definition Of Done" + "Mandatory Post-Implementation Gate") — this doc
routes to it and adds the repo-concrete checkpoints. Work is done only when **all** of the
following are true (CLAUDE.md list, verbatim in intent):

- the problem is understood; the scope is explicit
- the implementation matches approved intent; architecture fit is documented
- tests are adequate to the risk; quality gates are green
- security review is complete when needed; QA sign-off exists
- UAT and client approval exist where required
- docs are updated; release and rollback plans are ready
- support and operations are prepared; hypercare ownership is known

## Repo-concrete checkpoints

- **Gates green** — every applicable command in [quality-model.md](quality-model.md) (at
  minimum `npm run validate`, plus e2e and security scans for release-bound work).
- **Evidence recorded** — dev validation in the feature folder's `15-dev-validation-report.md`
  ([docs/features/README.md](../docs/features/README.md)); QA independently in `17-qa-report.md`
  ([docs/sdlc/qa-baseline.md](../docs/sdlc/qa-baseline.md)).
- **Behavior matrix updated** — new behavior gets numbered cases in
  [TEST_CASES.md](../TEST_CASES.md), each mapped to at least one automated test.
- **Docs move with the change** — same delivery stream, never "later"
  ([docs/sdlc/documentation-baseline.md](../docs/sdlc/documentation-baseline.md)); canonical
  knowledge docs pass [documentation-review-standard.md](documentation-review-standard.md).
- **Release notes** when behavior is user- or operator-visible
  ([release-notes/README.md](../release-notes/README.md)).
- **Known gaps recorded explicitly** — in the PR and, when durable, in
  [technical-debt-register.md](technical-debt-register.md); never hidden behind "mostly done"
  (CLAUDE.md General Operating Rules #17).

## Never "done"

Compile success, a passing happy path, or a disappeared symptom are not done (CLAUDE.md
Quality Engineering Core Mindset Rules #1–#9). A bug is done when the root cause is understood
and covered by a regression test ([testing/bug-triage-and-retest.md](../testing/bug-triage-and-retest.md)).
