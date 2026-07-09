# TwinzyAI AI Benchmark — MOCK mode

- Started: 2026-07-09T18:18:59.964Z
- Samples per entry: 3

## Caveats

- MOCK MODE: responses are canned fixtures and latencies are synthetic — this run validates the harness, scoring, and report format, NOT real providers.
- Run with --mode=real (and configured provider keys) to measure real models; real image steps additionally need --photo=<path>.

## Step: extraction

| entry | samples | schemaOk | safetyOk | failures | p50 ms | p95 ms | score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mock:valid-model | 3 | 100% | 100% | 0% | 1237 | 1274 | 0.998 |
| mock:schema-broken-model | 3 | 0% | 100% | 0% | 1237 | 1274 | 0.498 |
| mock:unsafe-model | 3 | 100% | 100% | 0% | 1237 | 1274 | 0.998 |

**Recommendation:** mock:valid-model (score 0.998)
- Expected shape: valid-model scores highest; schema-broken loses the schema axis; unsafe loses the safety axis.

## Step: generation

| entry | samples | schemaOk | safetyOk | failures | p50 ms | p95 ms | score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mock:valid-model | 3 | 100% | 100% | 0% | 1237 | 1274 | 0.998 |
| mock:schema-broken-model | 3 | 0% | 100% | 0% | 1237 | 1274 | 0.498 |
| mock:unsafe-model | 3 | 100% | 0% | 0% | 1237 | 1274 | 0.698 |

**Recommendation:** mock:valid-model (score 0.998)
- Expected shape: valid-model scores highest; schema-broken loses the schema axis; unsafe loses the safety axis.

## Step: judge

| entry | samples | schemaOk | safetyOk | failures | p50 ms | p95 ms | score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mock:valid-model | 3 | 100% | 100% | 0% | 1237 | 1274 | 0.998 |
| mock:schema-broken-model | 3 | 0% | 100% | 0% | 1237 | 1274 | 0.498 |
| mock:unsafe-model | 3 | 100% | 0% | 0% | 1237 | 1274 | 0.698 |

**Recommendation:** mock:valid-model (score 0.998)
- Expected shape: valid-model scores highest; schema-broken loses the schema axis; unsafe loses the safety axis.

## Step: translation

| entry | samples | schemaOk | safetyOk | failures | p50 ms | p95 ms | score |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mock:valid-model | 3 | 100% | 100% | 0% | 1237 | 1274 | 0.998 |
| mock:schema-broken-model | 3 | 0% | 100% | 0% | 1237 | 1274 | 0.498 |
| mock:unsafe-model | 3 | 100% | 0% | 0% | 1237 | 1274 | 0.698 |

**Recommendation:** mock:valid-model (score 0.998)
- Expected shape: valid-model scores highest; schema-broken loses the schema axis; unsafe loses the safety axis.

## Applying a recommendation

Set the step route explicitly, e.g. `AI_ROUTE_JUDGE=<winning entry>,<runner-up>` —
never auto-apply benchmark output without reviewing safety + cost first.
