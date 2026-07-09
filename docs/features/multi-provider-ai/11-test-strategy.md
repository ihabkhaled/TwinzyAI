# 11 - Test Strategy + Coverage Plan (compressed 11/12)

Requirement → layer mapping (all deterministic; provider HTTP mocked structurally, never live in tests):

## Config (unit)
- valid route strings parse (`provider:model`, bare model → gemini)
- invalid provider id in a route fails startup validation with a readable message
- enabled provider without a key fails; disabled provider without a key passes
- per-step route falls back to global route, then to legacy GEMINI_* chain
- capability declarations parse; unknown model defaults to text-only (fail-closed)

## Router (unit)
- resolves primary route per step; walks fallback on retryable provider error
- walks fallback on content-validation failure (invalid JSON/schema)
- capability guard: image call skips/never-dispatches to non-vision entries (and startup validation rejects an image-step chain with zero vision entries)
- fallback exhaustion → normalized 429 (if any rate-limit seen) else 502
- terminal (non-retryable) error stops the chain
- disabled provider entries are skipped
- shadow: sampled invocation fires after primary resolves, failures swallowed, result untouched, image withheld unless entry vision-capable + shadow-image enabled
- cancel signal aborts between entries

## OpenAI-compatible adapter (unit)
- request mapping: prompt → messages; image → data-URL content part (vision models); JSON response_format when declared
- response mapping: choices[0].message.content → text; empty → invalid-response error
- error mapping: 429 → RateLimited, 5xx/overloaded → retryable, 4xx → terminal; timeout aborts via AbortController
- never logs body content; auth header from config only

## Step services (existing + additions)
- each declares its step (already covered); image never reaches translation (existing translate integration test asserts zero image calls)

## Benchmark (unit + smoke)
- mock mode runs with zero keys, produces markdown + JSON report deterministically
- score calculation deterministic; unsafe/invalid outputs counted
- real mode refuses to run without explicit `--mode=real`

## Architecture (existing lint rules already enforce)
- no SDK imports outside adapters; no process.env outside config/bootstrap; no TS enum; no inline defs

Coverage: touched modules ride the repo gates (95/90/95/95). Evidence: gate outputs + benchmark mock report committed under docs/features/multi-provider-ai/.
