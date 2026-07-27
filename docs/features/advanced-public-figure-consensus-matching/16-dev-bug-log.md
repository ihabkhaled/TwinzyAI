# Development Bug Log

## Resolved during implementation

1. Coverage initially exposed untested council, retry, enrichment, and modal branches. Focused behavior tests raised the enforced global gate above 95/90/95/95.
2. The first public-figure integration test omitted the repository's `/api/v1` prefix and correctly returned 404. The test was corrected to the production route and now verifies 200/400 behavior.
3. The first ensemble implementation merged model final scores but did not invoke the deterministic formula. Structured judge evidence is now passed to the backend scoring owner; legacy/single-response behavior remains a compatibility fallback.
4. Prompt 5 initially existed only as a template. It is now wired through the configured finalizer route with a prose-only schema and authoritative fallback.
5. Catalog candidates initially lost retrieval lane/score evidence after model ranking. The server now reattaches verified retrieval metadata by entity ID before judging.
6. The production web build exposed that assigning an absent server feature flag to
   `process.env` creates the literal string `"undefined"`. The public mirror now copies only a
   defined value, with a regression test preserving the default-off build.
7. Arabic E2E still expected the legacy combined English rank string (`Match #1`). The test now
   verifies the localized Arabic label, isolated LTR rank, unchanged canonical name, and score.

## Open rollout items

- Expand and review the production catalog before enablement.
- Run the labeled private/synthetic benchmark with configured providers.
- Record security, accessibility, Arabic UAT, latency/cost, and owner acceptance.
- Verify external-source availability and licensing behavior in the deployment environment.
