# Implementation Record

Date: 2026-07-27

Status: Implemented behind default-off flags

## Architecture delivered

- Shared Zod contracts now describe bounded qualitative matching signals, counterfactual profiles, verified catalog profiles, structured model rankings/judge reports/critiques, consensus output, finalizer prose, and attributed public metadata.
- Prompt 1 produces stable, mutable, presentation, occlusion, contradiction, structure-first, and accessory-agnostic written evidence. No downstream prompt receives an image.
- The public-figures module owns a reviewed entity-ID catalog, deterministic retrieval lanes, entity resolution, bounded cache, allowlisted Wikidata/Wikipedia/Wikimedia adapters, and the post-match details endpoint.
- Configured generation and judge participants receive the same text-only catalog shortlist. Partial provider failure is tolerated when quorum remains.
- Prompt 4 produces structured critique. Validated tags can trigger exactly one bounded second retrieval pass.
- Backend consensus uses participant medians, stable/mutable/expression/confidence weights, agreement/retrieval/lane bonuses, and contradiction/uncertainty/unsupported-claim/quality penalties. Negative retrieval values cannot become negative bonuses.
- Prompt 5 can replace localized reason, mismatch-warning, and judge-note prose only. Its contract contains no score, rank, name, entity mutation, candidate-addition, or metadata field.
- Enrichment runs only after final aggregation, constructs or validates every URL, requires HTTPS/allowlisted hosts, rejects redirects and oversized/non-JSON responses, and falls back without affecting the match.
- The web result/share presentation supports attributed thumbnails, safe source links, an accessible focus-trapped modal, and isolated BiDi units for rank, label, name, metadata, and score.

## Privacy and safety invariants

- No face recognition, biometric comparison, embedding, landmark vector, coordinate ratio, or user/public-image comparison was added.
- Only trait extraction can receive the uploaded image. Candidate generation, judging, critique, finalization, enrichment, benchmark inputs, and sharing are text/metadata only.
- Public images are display-only and never feed matching.
- AI output remains Zod-validated, forbidden-wording filtered, and language-checked before public use.
- Provider/model identifiers remain server-internal.
- The catalog contains reviewed source records; it does not special-case any public figure as a production answer.

## Benchmark framework

The existing internal benchmark area now includes text-only advanced observations and metrics for recall@25, top-10/top-5 hit rate, regional and structure-first recall, stable-evidence precision, unsupported claims, major contradictions, cross-model agreement, entity resolution, licensed-image coverage, wrong-language rate, p50/p95 latency, and cost per analysis. The committed smoke fixture is synthetic and contains no photo or personal data.

No numeric product-accuracy claim is authorized by this implementation. Production activation requires a separately reviewed labeled benchmark.

## Compatibility

All advanced flags default to false. Existing schemas accept legacy model responses where advanced fields are optional, and the single-provider path remains unchanged. There is no database or data migration.
