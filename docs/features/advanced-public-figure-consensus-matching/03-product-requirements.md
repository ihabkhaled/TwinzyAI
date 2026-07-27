# Product Requirements

## User stories

1. As a player, I receive matches based primarily on stable written visible evidence, with mutable styling and uncertainty shown separately.
2. As an Arabic player, I receive Arabic reasons and correctly isolated Latin names, ranks, percentages, URLs, IDs, and licenses.
3. As a player, I can inspect verified public-figure information and image attribution in an accessible modal.
4. As a shared-link visitor, I receive the same safe enriched presentation without any uploaded image data.

## Acceptance criteria

- Matching profile separates stable, mutable, presentation, uncertain, contradiction, and accessory-agnostic signals.
- Occlusion lowers confidence/weight; counterfactuals never invent hidden structure.
- Candidates are catalog/entity-ID backed when the catalog flag is enabled.
- Configured participants rank/judge/critique the same shortlist; minimum-success degradation is bounded.
- Backend median/penalty formula is authoritative.
- Only final entity IDs are sent to enrichment adapters.
- URLs are constructed or parsed only by allowlisted adapters and strictly validated.
- Result card/modal/share UI is responsive, keyboard accessible, RTL-safe, and attribution aware.
- Wrong-language Arabic public text is rejected or translated and revalidated.
- Flags off preserve current behavior.

## Non-goals

Identity, exact likeness, biometrics, image similarity, demographic inference, user accounts, persistence of user data, arbitrary web crawling, social scraping, production candidate hardcoding, and guaranteed enrichment availability.

## Error states

Participant, catalog, cache, Wikipedia, Commons, or translation failure degrades safely to the current result/fallback when minimum evidence remains; no internal provider or source payload reaches the client.

