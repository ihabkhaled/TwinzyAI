# Architecture Review

## Data flow

Photo → extraction only → written detailed traits → qualitative matching profile → entity-ID catalog shortlist → configured text participants → structured critique → pure backend consensus → judge/aggregation → post-match metadata enrichment → additive public response.

## Boundaries

- AI module never imports public-figure internals; it consumes the module public surface.
- Public-figure adapters own external HTTP and hostname/content validation.
- Repository owns only bounded public catalog/cache state.
- Shared owns cross-side schemas/types/constants.
- Web remains Component → Hook → Service → Gateway with game module ownership.

## Privacy proof

Extraction remains the only image-capable call. Matching types contain no image slot. Enrichment accepts final entity ID and language only. Public images are display-only and cannot re-enter prompts, scores, matching evidence, share binary, or logs.

## ADR

See `architecture/adrs/advanced-text-only-public-figure-matching.md`.

## Decision

Approved for flag-off implementation. Production activation requires later GO evidence.

