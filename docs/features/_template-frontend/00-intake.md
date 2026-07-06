# 00 — Intake

> Capture the raw request exactly as it arrived, then decide whether it enters the lifecycle. Keep this document short; analysis belongs in later stages.

## Identification

- **Feature slug:** `<kebab-case-slug — becomes docs/features/<slug>/ and, usually, the module name under apps/web/src/modules/>`
- **Title:** <one-line human-readable feature name>
- **Requester:** <name, role, team>
- **Date received:** <YYYY-MM-DD>
- **Intake owner:** <who is shepherding this document>

## The request, verbatim

<Paste or transcribe the original request — ticket text, Slack message, meeting note. Do not paraphrase here; paraphrasing happens in 01-business-analysis.md.>

## Initial classification

- **Type:** <new feature | enhancement to existing module | refactor | compliance/security work>
- **Suspected surface:** <which existing modules under apps/web/src/modules/ (game, ui-preferences) or shared areas (apps/web/src/shared/, apps/web/src/packages/) look affected — best guess only>
- **New route needed?** <yes/no — if yes, note that ROUTE_PATHS in apps/web/src/shared/constants/route-paths.constants.ts will gain an entry (stage 04 decides the path)>
- **New third-party package suspected?** <yes/no — if yes, flag early: every vendor needs an owning wrapper under apps/web/src/packages/ per rules/10-library-modularization.md>
- **Touches a Twinzy non-negotiable?** <yes/no — image handling, AI safety copy, "free game" constraints (root CLAUDE.md "Twinzy Product Constraints"). If yes, security/privacy review in stage 08 is mandatory, not optional.>

## Urgency and sizing (gut check)

- **Priority:** <P0 incident-adjacent | P1 committed | P2 planned | P3 opportunistic>
- **T-shirt size:** <S | M | L | XL — refined in 07-implementation-plan.md>
- **Hard deadline:** <date + why, or "none">

## Go / no-go

- **Decision:** <proceed to 01-business-analysis | reject | park>
- **Rationale:** <one or two sentences>

## Gate

- [ ] Request captured verbatim
- [ ] Slug chosen and directory `docs/features/<slug>/` created from `_template-frontend/`
- [ ] Decision recorded with rationale

**Signed off by:** <name> — <YYYY-MM-DD>
