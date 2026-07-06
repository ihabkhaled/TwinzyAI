# Frontend Feature Lifecycle (`apps/web`)

Every frontend feature in `apps/web` moves through a fixed, gated document lifecycle before,
during, and after implementation. This lifecycle is the UI-focused variant of the enterprise SDLC
in [docs/sdlc/company-sdlc-policy.md](../../sdlc/company-sdlc-policy.md) and the root
[CLAUDE.md](../../../CLAUDE.md).

> **Which template do I use?** The **backend** (`apps/api`) uses the fuller 00–27 SDLC template in
> [docs/features/_template/](../_template/) (see [docs/features/README.md](../README.md)) — intake,
> business/product, architecture, impact, QA, security, UAT, go/no-go, release, hypercare,
> retrospective. This **frontend** template (this directory) is the leaner, UI-focused 00–13
> variant tuned for `apps/web`: it swaps the backend-heavy phases for UX/UI, accessibility,
> performance, and RTL/i18n gates. A feature that spans both sides runs the backend template for
> its `apps/api` work and this template for its `apps/web` work.

## How to run a feature through the lifecycle

1. Copy this template directory to a feature directory named with a kebab-case slug:
   - `docs/features/_template-frontend/` → `docs/features/<feature-slug>/` (e.g.
     `docs/features/share-result-card/`).
2. Fill the stage documents **in order**, starting at `00-intake.md`. Replace every
   `<angle-bracket>` prompt with real content. A stage document with unresolved prompts is not
   complete.
3. Each stage ends with a **Gate** section. The gate MUST be signed off (name + date) before the
   next stage starts. Skipped gates require a documented exception per
   [docs/exceptions/README.md](../../exceptions/README.md).
4. Stages 00–07 happen before or during implementation. Stages 08–11 are review gates that run
   against the finished code. Stages 12–13 happen after release.
5. When the retrospective (stage 13) closes, fold durable lessons into the memory corpus
   ([memory/known-pitfalls.md](../../../memory/known-pitfalls.md) and friends) — the feature
   directory itself is an immutable record.

## Stages

| Stage | Document                                                    | Purpose                                                                                                     |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 00    | [00-intake.md](00-intake.md)                               | Capture the raw request and decide whether it proceeds                                                     |
| 01    | [01-business-analysis.md](01-business-analysis.md)         | Business context, stakeholders, success metrics                                                            |
| 02    | [02-product-requirements.md](02-product-requirements.md)   | User stories, acceptance criteria, scope boundaries                                                        |
| 03    | [03-ux-ui-analysis.md](03-ux-ui-analysis.md)               | Screens, states, design-system fit, RTL and dark-theme impact                                              |
| 04    | [04-technical-refinement.md](04-technical-refinement.md)   | Module and layer plan, wrappers, message keys, routes, env                                                 |
| 05    | [05-architecture-review.md](05-architecture-review.md)     | Boundary and layer-policy sign-off against [rules/01-architecture.md](../../../rules/01-architecture.md)    |
| 06    | [06-test-strategy.md](06-test-strategy.md)                 | Test matrix per [testing/testing-strategy.md](../../../testing/testing-strategy.md)                        |
| 07    | [07-implementation-plan.md](07-implementation-plan.md)     | Task breakdown, skills to run, PR slicing                                                                   |
| 08    | [08-security-review.md](08-security-review.md)             | Security gate per [skills/security-review.md](../../../skills/security-review.md)                          |
| 09    | [09-performance-review.md](09-performance-review.md)       | Performance gate per [skills/performance-review.md](../../../skills/performance-review.md)                 |
| 10    | [10-accessibility-review.md](10-accessibility-review.md)   | Accessibility gate per [skills/accessibility-review.md](../../../skills/accessibility-review.md)           |
| 11    | [11-release-readiness.md](11-release-readiness.md)         | Release gate per [docs/sdlc/release-checklist.md](../../sdlc/release-checklist.md)                         |
| 12    | [12-hypercare.md](12-hypercare.md)                         | Post-release watch window, incidents, follow-ups                                                            |
| 13    | [13-retrospective.md](13-retrospective.md)                 | Lessons learned and memory-corpus updates                                                                  |

## Rules

- The lifecycle is sequential: a later stage MUST NOT be signed off while an earlier gate is open.
- Small features do not skip stages — they fill them briefly. "N/A — <reason>" is a valid answer
  to a prompt; an empty section is not.
- Every technical claim in stages 04–11 MUST reference real repo paths (module directories,
  wrapper exports, npm scripts), not descriptions from memory.
- Review stages 08–10 are performed by the matching reviewer (a human wearing the frontend
  security / React performance / accessibility hat — see [agents/README.md](../../../agents/README.md))
  — never by the feature author alone.
