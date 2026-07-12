---
id: quality-readme
title: quality/ — Quality System Area
type: quality
authority: canonical
status: current
owner: repository owner
summary: Index of the canonical quality docs — gates, definitions of ready/done, review standards, release readiness, and the debt/risk/waiver registers.
keywords: [quality, gates, review, coverage, definition-of-done, debt, risk, waiver, standards]
contextTier: 2
relatedCode: [package.json, .github/workflows/gate-lint.yml]
relatedTests: []
relatedDocs: [testing/README.md, docs/sdlc/README.md, rules/README.md]
readWhen: You need to know what quality bar applies to a change, or where debt, risks, and waivers are recorded.
---

# quality/ — Quality System Area

This area is the operational face of the quality system. Rule bodies live in
[rules/](../rules/README.md), testing standards in [testing/](../testing/README.md), and the
delivery baselines in [docs/sdlc/](../docs/sdlc/README.md) — these docs route to them and own
only what has no other home (the registers, the consolidated gate model, review standards for
docs and architecture).

## Contents

| Doc | Owns |
| --- | --- |
| [quality-model.md](quality-model.md) | The consolidated gate model: which checks exist, exact commands, where they run |
| [definition-of-ready.md](definition-of-ready.md) | When work may start (pre-implementation gate) |
| [definition-of-done.md](definition-of-done.md) | When work is done (routes to CLAUDE.md's Definition Of Done) |
| [code-review-standard.md](code-review-standard.md) | How code is reviewed (routes to rules/23) |
| [architecture-review-standard.md](architecture-review-standard.md) | How architecture fit is reviewed |
| [documentation-review-standard.md](documentation-review-standard.md) | How canonical docs are reviewed |
| [test-review-standard.md](test-review-standard.md) | How tests are reviewed (routes to testing/) |
| [release-readiness.md](release-readiness.md) | The release gate (routes to rules/24) |
| [technical-debt-register.md](technical-debt-register.md) | Known, accepted technical debt |
| [risk-register.md](risk-register.md) | Open product/operational risks |
| [waiver-register.md](waiver-register.md) | Gate waivers (currently none) |
| [exception-policy.md](exception-policy.md) | What may be excepted, what never may |
| [quality-metrics.md](quality-metrics.md) | What is measured and the last recorded values |

## Non-negotiables (owned elsewhere, binding here)

- No inline ESLint suppression, ever; no `@ts-ignore`/`@ts-expect-error`/`@ts-nocheck`
  (CLAUDE.md Non-Negotiable Gates; mechanically enforced per
  [docs/exceptions/README.md](../docs/exceptions/README.md)).
- Hooks and CI gates are never bypassed without a recorded, approved exception (CLAUDE.md;
  [docs/sdlc/README.md](../docs/sdlc/README.md)).
- Touched-module coverage ≥ 95/90/95/95 ([testing/coverage-policy.md](../testing/coverage-policy.md)).
