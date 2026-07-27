# Technical Roadmap

## Milestones

1. Contracts/builders and failing unit tests.
2. Catalog/lane retrieval and failing unit tests.
3. Ensemble reports, critique, scoring, second-pass guard, and degradation tests.
4. Enrichment security/cache and adapter mapping tests.
5. Additive result/share contracts and integration tests.
6. Result card/modal/BiDi/language tests and E2E.
7. Metrics/benchmark/docs/generated knowledge and complete gates.

## Compatibility

Feature flags default false. Existing endpoint, SSE stages, free mode, result fallbacks, and translation behavior remain available. Additive optional enrichment fields do not require stored-payload migration.

## Rollback

Disable flags first. If rollback requires code, revert focused commits; no database or user-data migration exists. Existing in-memory share/enrichment entries expire or disappear on restart.

