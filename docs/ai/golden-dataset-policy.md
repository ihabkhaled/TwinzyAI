---
id: ai-golden-dataset-policy
title: Golden Dataset Policy
type: doc
authority: canonical
status: current
owner: repository owner
summary: What curated evaluation data exists today (benchmark fixtures, test fixtures, operator photos with EXPECT names) and what a true golden dataset would add — currently deferred.
keywords: [ai, golden, dataset, fixtures, evaluation, quality, curation, policy]
contextTier: 2
relatedCode: [apps/api/src/benchmark/benchmark-fixtures.ts, apps/api/src/tests/fixtures/fake-ai-adapter.ts, scripts/calibrate.mjs]
relatedTests: [apps/api/src/benchmark/tests/benchmark.test.ts]
relatedDocs: [docs/ai/evaluation-framework.md, docs/ai/regression-evaluation.md, docs/ai-benchmarking.md]
readWhen: You are looking for curated AI evaluation data, or deciding whether to build a golden dataset.
---

# Golden Dataset Policy

"Golden dataset" here means: a curated, versioned set of inputs with expected outputs used to
score AI quality over time. This page records honestly what exists and what does not.

## What exists today

1. **Benchmark fixtures** —
   [`apps/api/src/benchmark/benchmark-fixtures.ts`](../../apps/api/src/benchmark/benchmark-fixtures.ts):
   self-contained canned model responses per step — one schema-valid, one schema-broken, one
   unsafe-wording each — deliberately built so the harness demonstrably measures all three metric
   axes ([benchmark-methodology.md](benchmark-methodology.md)). These are *harness-correctness*
   fixtures, not quality goldens.
2. **Test fixtures** — `apps/api/src/tests/fixtures/` (`fake-ai-adapter.ts`,
   `image-fixtures.ts`, `stubs.ts`): deterministic doubles for the unit/integration suites
   ([regression-evaluation.md](regression-evaluation.md)). They pin contracts, not match quality.
3. **Operator-owned calibration cases** — `scripts/calibrate.mjs` accepts real photos plus an
   optional `EXPECT="Name1,Name2"` env to check expected-name recall per photo
   ([evaluation-framework.md](evaluation-framework.md) Leg 3). The photos and expectations are
   operator-local by design and are **never committed** — committing user photos would violate
   the privacy posture ([docs/privacy-and-data-retention.md](../privacy-and-data-retention.md)).

## What does NOT exist (deferred)

Deferred — needs an owner decision plus privacy-safe sourcing:

- A committed, versioned golden set of *inputs → expected match qualities* scored automatically.
  Blockers recorded here so the gap is explicit:
  - real photos cannot be committed (privacy, consent — the same constraints that forbid image
    persistence apply to the repo);
  - trait-JSON-only goldens (no photos) would be committable and could score
    generation/judge steps deterministically, but no such set has been curated yet;
  - subjective "is this match good?" labels need an owner-defined rubric beyond the current
    schema/safety/speed axes.
- Automated recall/precision tracking across releases
  ([regression-evaluation.md](regression-evaluation.md) records the same gap at the process
  level).

## Policy for anyone adding golden data

1. **Never commit user photos or any image-derived personal data.** Text-only goldens
   (trait JSON, candidate pools, expected verdicts) are the acceptable form.
2. Derive shapes from the shared schemas so goldens cannot drift from the contract
   ([schema-contracts.md](schema-contracts.md)); the benchmark fixtures show the pattern
   (they build from `TRAIT_CATEGORY_FIELDS`).
3. Keep en+ar parity for any language-sensitive golden, mirroring the safety lists' bilingual
   policy ([forbidden-wording.md](forbidden-wording.md)).
4. Wire new goldens into an existing leg of the evaluation framework rather than inventing a new
   harness ([evaluation-framework.md](evaluation-framework.md)).
