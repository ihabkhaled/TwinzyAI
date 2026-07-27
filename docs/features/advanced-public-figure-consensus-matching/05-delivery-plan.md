# Delivery Plan

## Workstreams and sequence

1. Shared bounded contracts, matching-profile builder, tests.
2. Catalog retrieval/entity IDs and deterministic lane merge.
3. Ensemble ranking/judging/critique and consensus scoring in shadow/flag mode.
4. Allowlisted enrichment adapters/cache and lazy detail API.
5. Arabic language validation, result card/modal/share UI.
6. Observability, benchmark, docs, generated knowledge, full gates.

## Branch and review

Branch: `agent/advanced-public-figure-consensus-matching`. Focused conventional commits; hooks are never bypassed. Commit, push, or open a PR only when the repository owner explicitly requests it after complete local validation.

## Dependencies and blockers

No implementation blocker. Production activation is blocked until catalog review, provider configuration, benchmark acceptance, security/QA/UAT, and owner GO.

## Rollout and rollback

Seven flag-controlled phases follow the supplied order. Immediate rollback is environment-only by disabling advanced matching, catalog, ensemble, critique, second pass, enrichment, and modal flags.
