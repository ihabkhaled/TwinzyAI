# Threat Model

## Protected assets

Uploaded image confidentiality, extracted written traits, provider credentials/routes, public result integrity, catalog provenance, external-link safety, and license attribution.

## Trust boundaries and controls

- Upload boundary: the existing consent, size/type/magic/decode/scan chain remains unchanged; the image is memory-only and wiped.
- AI boundary: only Prompt 1 receives the image. Every later response is bounded by Zod, safety wording, entity IDs, language checks, quorum, and backend scoring.
- Consensus boundary: model scores are advisory. Median evidence assessments and deterministic server weights/penalties own the public score. Prompt 5 cannot submit a score or entity change.
- External metadata boundary: URLs are constructed by adapters or accepted only after HTTPS and exact/suffix-host allowlisting. Redirects, non-JSON content, and oversized responses fail. No AI-generated URL is consumed.
- Image boundary: Wikimedia media needs source-page and license metadata; it is fetched after matching and never re-enters AI or retrieval.
- Browser boundary: external links use safe targets/relationships; names use `bdi`; dialog focus is trapped and restored.
- Availability boundary: participant calls time out and settle independently; enrichment sources fall back independently; bounded cache and request throttling limit repeated work.
- Privacy/logging boundary: no image bytes, full prompts, biographies, provider secrets, or user traits are logged to external metadata services.

## Residual risks

Catalog curation errors, source metadata changes, provider disagreement, transient source outages, subjective entertainment-quality variance, and cost/latency under real traffic remain. Default-off flags, bounded fallbacks, labeled benchmarks, and staged rollout contain these risks.
