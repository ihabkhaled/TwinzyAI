# 10 - Engineering Standards Check

## Purpose

Freeze the implementation rules before coding begins.

## Step-by-Step Workflow

1. Review the permanent engineering standards: `rules/00-non-negotiable-rules.md` first, then the topic rules touched by this request, plus `docs/sdlc/engineering-standards.md`.
2. Identify any request-specific rules.
3. Record how the change will satisfy code quality, security, observability, i18n, accessibility, and documentation expectations.
4. If a new permanent rule emerges, update `rules/` (source of truth) and mirror it in `CLAUDE.md` / `AGENTS.md`; record the decision in `memory/`.

## Standards Review Matrix

| Standard area | Requirement | How this request will comply |
| --- | --- | --- |
| Architecture boundaries (`rules/01`, `rules/16`) | | |
| Naming and module structure (`rules/05`, `rules/10`) | | |
| Error handling (envelope, `rules/18`, `rules/21`) | | |
| Logging and observability (`rules/22`) | | |
| Accessibility (`rules/13`) | | |
| Localization / content (`rules/12`) | | |
| Secure coding (`rules/06`, `rules/15`) | | |
| Privacy / AI safety (`rules/14`) | | |
| Testing and coverage (`rules/09`, `testing/`) | | |
| Documentation | | |
| Release readiness (`rules/24`) | | |

## Request-Specific Rules

- [Rule 1]

## Permanent Policy Update Check

- New permanent rule discovered: [yes / no]
- If yes, describe the rule: [text]
- `rules/` updated: [yes / no / pending]
- `CLAUDE.md` / `AGENTS.md` mirror updated: [yes / no / pending]
- Decision recorded in `memory/`: [yes / no / pending]

## Exit Checklist

- [ ] Standards reviewed
- [ ] Request-specific rules documented
- [ ] Permanent-rule update decision made
- [ ] Implementation constraints are visible to the team

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | | approve / revise | |

## Evidence And References To Attach

- relevant standards docs, style guides, ADRs, security baselines, and testing baselines
- links to permanent-rule updates if needed

## Phase Blockers

Do not close this phase if:

- request-specific constraints are only in someone’s head
- permanent-rule implications were noticed but not reflected in `rules/` and the `CLAUDE.md` mirror
- implementation standards still differ between people working the change
