# 23 — Documentation Changelog: AI Knowledge Operating System

Everything updated in this delivery stream, and why.

## New canonical areas (writer fleet, evidence-grounded, frontmattered)

- `structure/` (23 files) — repository map, module catalog + ownership map (compiler input),
  layer map, runtime topology, entrypoint/command catalogs, analyze/share/payment flows,
  per-module docs.
- `product/` (15) — vision, principles, journeys, feature catalog, constraints, non-goals,
  privacy promises, **monetization-policy.md** (canonical paywall-status statement),
  copy principles.
- `domain/` (16) — glossary, entities, invariants, policies, state machines, trait taxonomy,
  consent model, **image-lifecycle.md** (canonical lifecycle statement), sharing/language
  lifecycles, safety boundaries, failure semantics.
- `contracts/` (16) — API endpoints (incl. SSE events, error envelope), AI provider port +
  prompt IO, shared-schema catalog, env contract, PayPal/ClamAV/Gemini/OpenAI-compat
  integration contracts.
- `operations/` (14) + `incidents/` (6) + `quality/` (16) — deployment/scaling/budgets/
  observability/health/shutdown; incident process + templates; quality model, DoR/DoD,
  review standards, debt/risk/waiver registers.
- `docs/ai/` (27) — pipeline, prompts, providers, routing/fallback/shadow, safety filters,
  written-traits-only boundary, injection threat model, validation, budgets, change checklists.
- `support/` (+18) and `runbooks/` (+23) — behavior guide, FAQ, error catalog, troubleshooting;
  operational procedures from local dev to privacy incidents.
- `knowledge/summaries/` (13) — compiled-view sources for `.ai/summaries/`.

## Knowledge system (authored)

`knowledge/`: README, manifest, authority-map, routing-map (26 task types), vocabulary,
relationship-types, freshness-policy, context-budget-policy, risk-classification,
delivery-lanes, contradiction-checks (+3-entry registry), packs (26), golden tasks (21) +
questions (11), bootstrap + hot-memory sources, templates.

## Policy and rules

- CLAUDE.md: constraint #1 rewritten to the recorded 2026-07-12 supersession; new
  "AI Knowledge Operating System And Delivery Lanes" permanent-policy section; repository
  structure updated.
- rules/00 rule 42 rewritten; new rules 31–36; rules/README table extended.
- AGENTS.md fast-task protocol + paywall truth + folder map; 8 model mirrors + CODEX.md +
  cursor.md + .cursorrules + .cursor/rules/non-negotiables.mdc aligned (bootstrap-first read
  order + corrected monetization line).
- skills/resolve-task-context.md (new); docs/eslint-architecture.md (+2 documented
  relaxations); docs/package-decisions.md (+yaml decision).

## Generated (committed, never hand-edited)

`.ai/` — BOOTSTRAP, HOT_MEMORY, QUICK_ROUTER, CURRENT_STATE, README, 15 manifests, 16 indexes,
26 packs, 13 summaries, 6 graphs, hash snapshots + generated-from registry, findings reports.

## Remaining documentation gaps (owned)

Orphan-candidate review (34 legacy docs), progressive frontmatter adoption (~468 legacy docs,
adopt-on-edit), stale source comments flagged by writers (fast-lane cleanup), SLO/AI-cost
numbers awaiting owner targets (marked Deferred in operations/).
