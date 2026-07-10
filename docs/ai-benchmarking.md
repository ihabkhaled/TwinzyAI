# AI Benchmarking

`npm run ai:benchmark` measures provider/model candidates per pipeline step with the SAME validators production uses (step Zod schemas + forbidden-wording scan), and writes a markdown + JSON report under `benchmark-results/run-<mode>-<timestamp>/ (gitignored — reports/results never enter git; only scripts, code, and docs are committed)`.

## Modes

- **Mock (default, CI-safe, zero keys):** `npm run ai:benchmark -- --mode=mock --samples=5`
  Runs deterministic canned fixtures (a valid model, a schema-broken model, an unsafe-worded model) through the metric pipeline. It validates the harness, the scoring, and the report format — NOT real providers. Byte-identical output for identical inputs (no randomness), so it is safe to assert on in CI.
- **Real (explicit, billed):** `npm run ai:benchmark -- --mode=real --samples=3 [--photo=./me.jpg]`
  Boots the app context and measures every **enabled + usable** route entry configured for each step (`AI_ROUTE_<STEP>` / legacy Gemini chains), live. Only extraction receives `--photo` and requires a vision-capable entry. Generation and judging are text-only and reuse the first schema-valid extraction/generation output; translation is text-only and independent. The photo is read locally, never written, and never sent to downstream steps.

## Metrics + score

Per entry: schema-validity rate, safety-scan rate, failure rate, latency p50/p95, and a weighted score (schema 0.5, safety 0.3, speed 0.2 under a 120s ceiling). The per-step recommendation is the top score — **never auto-applied**: review safety, cost, and the provider's photo-privacy posture (see `docs/features/multi-provider-ai/02-provider-research.md`), then set `AI_ROUTE_<STEP>` yourself.

## Guardrails

- Real mode is opt-in via `--mode=real` and warns before running; mock is the default.
- No private user data: mock uses fixtures; real image runs use the photo YOU pass on the CLI.
- Reports contain metrics only — never model output content, never image bytes.
