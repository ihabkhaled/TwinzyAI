# ADR — Advanced Text-Only Public-Figure Matching

Date: 2026-07-27

Status: Accepted for flag-off implementation

## Context

Open-ended model recall is difficult to verify, overweights mutable styling, and cannot provide authoritative scores or licensed display metadata.

## Decision

Twinzy will build a bounded qualitative matching profile from written visible evidence, retrieve entity-ID candidates from a reviewed public-figure catalog, obtain structured evidence assessments from configured text-capable participants, and calculate final scores in backend code using medians and explicit penalties. Wikidata, Wikipedia, and Wikimedia Commons adapters may enrich only final entity IDs for display.

The uploaded image is never compared with a public-figure image. No face embeddings, biometric templates, landmark vectors, ratios, or pixel comparisons are created. Matching remains based on qualitative written visible evidence. Public-figure images are fetched only after final matching and never re-enter retrieval, ranking, judging, critique, consensus, prompts, sharing binary, or scoring.

## Consequences

Results are explainable and sourceable but catalog curation, external availability, latency/cost, licenses, language validation, and benchmark maintenance become explicit operational concerns. Default-off flags and current-path fallback make rollback immediate and data-migration free.

