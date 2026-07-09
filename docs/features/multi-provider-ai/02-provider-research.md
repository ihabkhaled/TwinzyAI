# TwinzyAI Multi-Provider Routing — Provider Comparison Research (July 9, 2026)

## 1. Introduction

TwinzyAI's pipeline has four AI steps with distinct risk profiles: (1) **extraction** (photo → 221-field strict JSON; vision + structured output + low hallucination), (2) **generation** (photo + evidence → lookalike candidate pool; regional celebrity recall critical), (3) **judge** (photo + evidence + candidates → conservative verified scores; safety-critical), (4) **translation** (text-only en↔ar of the result JSON; cost/speed win).

Two hard gates dominate routing before any capability comparison:

1. **Photo-privacy gate** (steps 1–3 send the photo). *Pass:* Gemini paid tier (no training; limited abuse-detection logging), Anthropic (images ephemeral, deleted after the request, never trained on — best-in-class). *Conditional:* OpenAI (no training by default, but 30-day retention unless ZDR is negotiated — not self-serve), Qwen (stated no-training, but unspecified log retention — needs DPA confirmation), Z.ai (no-storage DPA text, PRC-parent trust discount). *Fail:* Moonshot/Kimi (API images explicitly training-eligible, no ZDR), DeepSeek (no vision at all; PRC storage + inputs-may-improve-services terms).
2. **Person-in-photo refusal gate** (steps 2–3 name public figures who resemble a photo). OpenAI models are safety-trained to refuse identifying people in photos (no relaxation evidenced through GPT-5.6, which adds MORE safety monitoring); Anthropic's vision docs state Claude "cannot be used to name people in images and refuses to do so" (AUP-backed). **Gemini's real-people restriction applies to image *generation*, not understanding** (>90% public-figure recognition documented) — the incumbent is the only Western provider that reliably does the app's core loop with the photo in the loop. Qwen advertises celebrity recognition and is less refusal-prone; GLM is untested; Kimi/DeepSeek are gated anyway.

## 2. Per-Provider Summaries

### 2.1 Google Gemini (incumbent) — the only provider strong at all four steps
- **Models:** `gemini-3.5-flash` GA workhorse ($1.50/$9.00, 167–278 tok/s, thinking_level tunable), `gemini-3.1-pro-preview` flagship ($2/$12; **still preview-only after ~5 months** — 2-week deprecation-notice class), `gemini-3.1-flash-lite` GA budget ($0.25/$1.50, ~311–382 tok/s, GA until ≥May 2027), legacy 2.5 family **shuts down Oct 16, 2026**.
- **Fit:** top vision, native constrained-decoding structured output (221-field schema proven in production — the "schema too complex" risk is managed), #1 Arabic (Artificial Analysis Multilingual Index), best Egyptian/Arab celebrity recall of any Western provider, and no refusal friction on person-understanding.
- **Watch:** price escalation trend (3.5 Flash = 3× predecessor), thinking tokens bill as output, 20–30s TTFT at high thinking, no GA Pro model, free-tier keys train on data (billing must be active on EVERY environment key), ~2 forced migrations/year.

### 2.2 OpenAI — best structured outputs and translation; refusal risk kills generation
- **Models:** `gpt-5.6` family GA'd *today* (Sol $5/$30, Terra $2.50/$15, Luna $1/$6 — treat as unproven); proven `gpt-5.4` $2.50/$15, `gpt-5.4-mini` $0.75/$4.50, `gpt-5.4-nano` $0.20/$1.25.
- **Fit:** best-in-class strict structured outputs (constrained decoding, native Zod SDK), tier-1 Arabic incl. Egyptian dialect (best proprietary at dialect↔MSA per 2026 study), ~90% prompt-cache discount.
- **Blockers:** hard-trained refusals on identifying people in photos → generation 2/5, judge 3/5; 30-day photo retention unless ZDR granted; a facial-resemblance app sits near usage-policy likeness clauses — needs a legal/policy read; quarterly churn.

### 2.3 Anthropic — best extraction quality + best photo privacy; AUP blocks photo→name steps
- **Models:** `claude-sonnet-5` workhorse ($3/$15; intro $2/$10 until 2026-08-31), `claude-haiku-4-5` $1/$5, `claude-opus-4-8` $5/$25, `claude-fable-5` $10/$50 (**requires 30-day retention — never for photos**).
- **Fit:** grammar-constrained structured outputs GA (guaranteed schema-valid), best honesty/low-hallucination reputation, Arabic at ~97% of English performance, images ephemeral and never trained on (strongest privacy for the photo). Extraction is a 5/5 fit (describing visible traits involves no naming).
- **Blockers:** naming people in images is documented refusal + AUP territory → generation 2/5, judge 3/5 (photo attached); OpenAI-compat layer lacks structured outputs → **native Messages API required**; per-generation breaking request changes; 529 overload spikes need retry (TwinzyAI already has content-level fallback).

### 2.4 DeepSeek — text-only API; translation-only candidate
- `deepseek-v4-flash` $0.14/$0.28 (cache hits near-free), v4-pro $0.435/$0.87. **No vision on the public API** → disqualified from steps 1–3 as designed. JSON mode only (no json_schema; documented empty-content bug, ~5–12% mismatch). Legacy ids `deepseek-chat`/`deepseek-reasoner` **hard-deprecated 2026-07-24 (15 days away)**. Peak/off-peak pricing doubles costs during Beijing peaks overlapping Egyptian mornings. PRC storage + inputs-may-improve-services terms strain consent-copy accuracy even for trait-text translation.

### 2.5 Alibaba Qwen — best non-Google option for generation; weak JSON enforcement
- `qwen3-vl-plus` $0.20/$1.60 (vision, advertised "recognize everything" celebrity recognition, less refusal-prone than US providers), `qwen3.7-plus` $0.40/$1.60 (multimodal), `qwen-flash` $0.05/$0.40 (text budget), `qwen3.7-max` $2.50/$7.50 (text-focused flagship).
- Strong Arabic (201 languages, Arabic-efficient tokenizer), but Egyptian-dialect and Egyptian celebrity DEPTH unverified — **benchmark before adoption**. `json_object` only (no schema-constrained decoding); thinking mode incompatible with JSON mode. Short deprecation windows (30 days for snapshots) with quota throttling from notice date. Privacy: stated no-training, Singapore residency, but unspecified log retention → written DPA confirmation before sending photos.

### 2.6 Moonshot/Kimi — technically capable, privacy-disqualified for photos
- `kimi-k2.6` $0.95/$4.00, `kimi-k2.5` $0.60/$3.00; genuinely strong open-weights vision (OCRBench 92.3) and now real `json_schema` support. **Hard blocker:** privacy policy makes API inputs *including images* training-eligible with no ZDR and open-ended retention → fails TwinzyAI's constraint for steps 1–3; trait text still training-eligible for translation. ~10-month model lifetimes with hard retirements; fixed temperatures; mid-rebrand to platform.kimi.ai. Open weights via US hosts (Fireworks/DeepInfra) would fix privacy but is a different provider decision.

### 2.7 Z.ai (GLM) — cheap and Arabic-strong, but vision models lack JSON mode
- Text: `glm-5.2` $1.40/$4.40 (~191 tok/s), `glm-5` #2 on SILMA Arabic Broad Benchmark, `glm-4.7-flashx` $0.07/$0.40 (+ free flash tiers). Vision: `glm-5v-turbo` $1.20/$4.00 (closed weights, API-only), `glm-4.6v` $0.30/$0.90.
- **Critical gap:** no `response_format` documented on ANY vision model — the 221-field schema would ride on prompt-only JSON. PRC National Intelligence Law analyst concerns + US Entity List optics for photo steps. Good news: old models stay served (low forced-deprecation risk); most weights MIT (except glm-5v-turbo). Best fit: text-only translation.

## 3. Comparison Matrix

| | Gemini | OpenAI | Anthropic | DeepSeek | Qwen | Kimi | Z.ai GLM |
|---|---|---|---|---|---|---|---|
| Vision input | ✅ all models | ✅ all | ✅ all | ❌ none | ✅ VL line + 3.7-plus | ✅ K2.5/2.6 | ✅ separate V line |
| Strict schema-constrained JSON | ✅ native | ✅ best-in-class | ✅ GA (native API only) | ❌ json_object | ❌ json_object | ✅ json_schema | ❌ (❌❌ on vision) |
| Names public figures from photo | ✅ | ❌ refuses | ❌ refuses (AUP) | n/a | ✅ (advertised) | ❓ unproven | ❓ unproven |
| Arabic quality | #1 | Tier-1 (best Egyptian dialect) | ~97% of EN | Tier-2 | Strong (MSA) | Unproven | #2 SILMA (MSA) |
| Egyptian/Arab celeb recall | Best | Good (text), suppressed w/ photo | Good (text), suppressed | Unverified | Plausible, unverified | Unverified | Likely weak |
| Photo privacy (API) | ✅ paid tier no-training | ⚠️ 30-day retention unless ZDR | ✅✅ ephemeral, never trained | ❌ PRC + improve-services | ⚠️ no-training, retention unclear | ❌ training-eligible | ⚠️ no-storage DPA, PRC parent |
| Cheapest usable vision model | flash-lite $0.25/$1.50 | 5.4-nano $0.20/$1.25 | Haiku $1/$5 | — | vl-flash $0.05/$0.40 | K2.5 $0.60/$3 | 4.6v $0.30/$0.90 |
| Deprecation posture | ~2 forced/yr; flagship preview-only | ≥6mo GA notice; quarterly churn | Formal, but breaking param changes | Ids mutate; 2-wk-away deprecation | 30-day snapshot windows | ~10-mo hard retirements | Old models stay served |
| OpenAI-compatible endpoint | ✅ (beta) | ✅ native | ⚠️ no structured outputs → unusable | ✅ | ✅ | ✅ | ✅ |

## 4. Per-Step Weighted Scorecards

Scores 1–5 per criterion; weights per the routing spec (high=3–4, medium=2, low=1). ⛔ = hard gate (refusal or photo-privacy) — weighted score is informational only.

### 4.1 Extraction (weights: vision .1875, JSON .1875, non-hallucination .1875, photo-safety/privacy .1875; speed .125, cost .125)

| Provider | Vision | JSON | Non-halluc. | Safety/privacy | Speed | Cost | **Weighted** |
|---|---|---|---|---|---|---|---|
| **Gemini** (3.5-flash) | 5 | 5 | 4.5 | 4.5 | 4.5 | 4 | **4.63** |
| Anthropic (sonnet-5) | 5 | 5 | 5 | 5 | 3.5 | 3 | **4.56** |
| OpenAI (5.4/terra) | 4.5 | 5 | 4.5 | 3.5 | 4 | 3.5 | **4.22** |
| Qwen (qwen3-vl-plus) | 4 | 2.5 | 3.5 | 3 | 3.5 | 5 | 3.50 |
| Kimi (k2.5) ⛔privacy | 4.5 | 3.5 | 3.5 | 1 | 3 | 4.5 | 3.28 |
| Z.ai (glm-4.6v) | 3.5 | 2 | 3 | 2.5 | 4 | 5 | 3.19 |
| DeepSeek ⛔no vision | 1 | 2 | 3 | 1.5 | 3.5 | 5 | 2.47 |

### 4.2 Generation (recall/diversity 3, photo-in-loop viability 3, JSON 3, cost 3; vision 2, speed 2 — /16)

| Provider | Recall | Viability | JSON | Cost | Vision | Speed | **Weighted** |
|---|---|---|---|---|---|---|---|
| **Gemini** (3.5-flash / 3.1-pro-preview) | 5 | 5 | 5 | 4 | 5 | 4.5 | **4.75** |
| Qwen (qwen3-vl-plus) | 3.5* | 4.5 | 2.5 | 5 | 4 | 3.5 | **3.84** |
| Kimi ⛔privacy | 3 | 3.5 | 3.5 | 4.5 | 4.5 | 3 | 3.66 |
| OpenAI ⛔refusals | 3.5 | 1.5 | 5 | 3.5 | 4 | 4 | 3.53 |
| Anthropic ⛔AUP | 3 | 1.5 | 5 | 3.5 | 5 | 3.5 | 3.50 |
| Z.ai (glm-5v-turbo) | 3 | 3.5 | 2 | 5 | 3.5 | 4 | 3.47 |
| DeepSeek ⛔no vision | 2.5 | 1 | 2.5 | 5 | 1 | 3.5 | 2.63 |

*Qwen recall is plausible but unverified for Egyptian figures — run a recall benchmark (Egyptian actors/footballers/singers) before adopting.

### 4.3 Judge (safety/non-hallucination 4, reasoning 3, JSON 3, photo-in-loop viability 3; cost+speed 2 — /15)

| Provider | Safety/non-halluc. | Reasoning | JSON | Viability | Cost+speed | **Weighted** |
|---|---|---|---|---|---|---|
| **Gemini** (3.5-flash high / 3.1-pro-preview) | 4.5 | 4.5 | 5 | 5 | 3.5 | **4.57** |
| Anthropic ⛔photo refusal risk | 5 | 5 | 5 | 2.5 | 3 | 4.23 |
| OpenAI ⛔photo refusal risk | 4.5 | 5 | 5 | 2.5 | 3 | 4.10 |
| Qwen (thinking↔JSON conflict) | 3.5 | 4 | 2 | 4 | 4 | 3.47 |
| Kimi ⛔privacy | 3 | 4 | 3.5 | 2 | 3.5 | 3.17 |
| Z.ai (glm-5v-turbo) | 3 | 3.5 | 2 | 3.5 | 4 | 3.13 |
| DeepSeek ⛔no vision | 3 | 4 | 2.5 | 1 | 4.5 | 2.90 |

Note: Anthropic scores 5/5 as a **text-only** judge over trait evidence (no photo attached) — the best cross-provider fallback if the photo is dropped from the fallback path.

### 4.4 Translation (cost 4, speed 3, Arabic 3, JSON 2, stability/privacy 2 — /14)

| Provider | Cost | Speed | Arabic | JSON | Stability/privacy | **Weighted** |
|---|---|---|---|---|---|---|
| **Gemini** (3.1-flash-lite) | 4.5 | 5 | 5 | 5 | 4.5 | **4.79** |
| OpenAI (gpt-5.4-nano) | 4.5 | 4.5 | 5 | 5 | 4 | **4.61** |
| Qwen (qwen-flash) | 5 | 4 | 4.5 | 3.5 | 3 | 4.18 |
| Z.ai (glm-4.7-flashx) | 5 | 4 | 4.5 | 3.5 | 3 | 4.18 |
| Anthropic (haiku-4-5) | 3 | 4 | 4.5 | 5 | 4 | 3.96 |
| DeepSeek (v4-flash) | 5 | 3.5 | 4 | 3 | 2 | 3.75 |
| Kimi (k2.5) | 3.5 | 3 | 3.5 | 3.5 | 2 | 3.18 |

## 5. Named Routes (per-step provider:model)

### 5.1 Best-quality
- Extraction: **anthropic:claude-sonnet-5** (guaranteed schema-valid output, best honesty, best photo privacy; no naming involved so no AUP friction)
- Generation: **google:gemini-3.1-pro-preview** (max recall + #1 Arabic; preview risk covered by fallback to gemini-3.5-flash)
- Judge: **google:gemini-3.1-pro-preview** (fallback google:gemini-3.5-flash @ thinking high)
- Translation: **google:gemini-3.5-flash** (thinking minimal)
- ~Cost/game: highest; two adapters (native Anthropic + native Gemini). Requires the 221-field schema ported to Anthropic constraints (additionalProperties:false, constraints stripped server-side — TwinzyAI's Zod covers it).

### 5.2 Best-balanced (recommended default)
- Extraction: **google:gemini-3.5-flash** (thinking low/medium) — proven schema, GA
- Generation: **google:gemini-3.5-flash**
- Judge: **google:gemini-3.5-flash** (thinking high); fallback **anthropic:claude-sonnet-5** in text-only mode
- Translation: **google:gemini-3.1-flash-lite**
- Rationale: highest weighted score at every step, one primary vendor, all-GA models, no refusal friction, acceptable privacy on paid tier.

### 5.3 Cheapest-acceptable
- Extraction: **google:gemini-3.1-flash-lite** ($0.25/$1.50; vision + structured output + GA — do NOT cheap out onto json_object-only providers for 221 fields)
- Generation: **alibaba:qwen3-vl-plus** ($0.20/$1.60, gated on an Egyptian-celebrity recall benchmark + DPA photo confirmation); fallback google:gemini-3.1-flash-lite
- Judge: **google:gemini-3.5-flash** (thinking medium) — the safety-critical step is the cost floor; don't go below
- Translation: **alibaba:qwen-flash** ($0.05/$0.40; stated no-training, Singapore) — DeepSeek is $0.14 in and PRC-resident, so Qwen is both cheaper and safer
- ~Cost/game: pennies; adds the shared OpenAI-compatible adapter (DashScope compat mode).

### 5.4 Fastest-acceptable
- Extraction: **google:gemini-3.1-flash-lite** (~311–382 tok/s, ~4.8s TTFT)
- Generation: **google:gemini-3.5-flash** (thinking minimal — low TTFT)
- Judge: **google:gemini-3.5-flash** (thinking low — accepts a deliberateness trade-off; never disable structured output)
- Translation: **google:gemini-3.1-flash-lite** (near-instant)
- Avoids all high-thinking 20–30s TTFT modes → protects SSE/stream timeouts and the multi-tab stream-isolation layer.

### 5.5 Safest-production
- Extraction: **google:gemini-3.5-flash** (GA, schema proven in prod, paid-tier no-training); cross-provider fallback **anthropic:claude-sonnet-5**
- Generation: **google:gemini-3.5-flash** (only GA model with proven no-refusal person-understanding + top MENA recall)
- Judge: **google:gemini-3.5-flash** (thinking high; GA — deliberately NOT the preview Pro); fallback **anthropic:claude-sonnet-5 text-only** (photo dropped on fallback → best conservatism, zero AUP exposure)
- Translation: **google:gemini-3.1-flash-lite** (GA until ≥May 2027); fallback **openai:gpt-5.4-nano**
- No preview models anywhere; every photo-bearing call goes only to providers with no-training + ephemeral/limited retention; every step has a cross-provider fallback wired through the existing content-level fallback mechanism.

## 6. Top Pick Per Step

| Step | Pick | Why |
|---|---|---|
| Extraction | google:gemini-3.5-flash | GA, 221-field schema proven in production, native constrained decoding, top vision, paid-tier no-training |
| Generation | google:gemini-3.5-flash | Best Egyptian/Arab celebrity recall among providers that will actually look at the photo; no person-understanding refusals |
| Judge | google:gemini-3.5-flash (thinking high) | GA + vision + structured output + no refusal friction; 3.1-pro-preview as quality escalation behind fallback |
| Translation | google:gemini-3.1-flash-lite | $0.25/$1.50, ~350 tok/s, GA to ≥May 2027, top-tier Arabic |

## 7. Adapter Strategy (summary — full detail in structured field)

Three adapters cover everything: (1) native Gemini (primary, keep), (2) one generic OpenAI-compatible adapter with per-provider config (baseUrl, key, model, capability flags) covering OpenAI, DeepSeek, Qwen, Kimi, Z.ai and Gemini's compat endpoint as an emergency shim, (3) native Anthropic Messages adapter (their OpenAI-compat layer lacks structured outputs, so it cannot be used for this pipeline).

## 8. Risks

1. **Gemini concentration risk** — the best-balanced/safest routes are all-Google. Mitigate with the Anthropic extraction/text-judge fallback and the OpenAI-compatible translation fallback; keep every model id env-driven (already policy).
2. **Preview flagship** — gemini-3.1-pro-preview has no GA SKU and a 2-week deprecation class; never make it a sole dependency for the judge.
3. **Forced migration due ~Oct 16, 2026** — if any GEMINI_MODEL env still points at 2.5-flash/-lite, migrate within ~3 months and re-run the 221-field schema-compatibility + safety-filter regression on 3.x (schema "too many states" rejections can reappear across model versions).
4. **Refusal-boundary providers** — OpenAI/Anthropic photo→named-figure calls are policy-adjacent; if ever used for generation/judge with the photo, run a refusal-rate spike test first and treat prompt-workarounds as usage-policy violations (account risk).
5. **Photo-privacy misconfiguration** — a free-tier Gemini key on any environment turns user photos into training data → privacy incident under the consent copy. Enforce billing-active checks per key; if OpenAI is added for photo steps, ZDR must be negotiated first (30-day default retention conflicts with the no-persistence posture).
6. **Price volatility** — Sonnet 5 intro pricing expires 2026-08-31 (+50%); Gemini shows a 3× generation-over-generation increase; DeepSeek doubles at Beijing peaks overlapping Egyptian mornings; OpenAI repriced GPT-5.2 on July 2. Budget against live price sheets; cap thinking/reasoning levels via env to bound judge-step output-token cost.
7. **Latency vs streaming** — high-thinking TTFT (20–30s) can trip SSE timeouts and the multi-tab stream-isolation layer; pin thinking levels per step via env and load-test the judge path.
8. **Imminent third-party breakage** — deepseek-chat/deepseek-reasoner ids die 2026-07-24; Qwen snapshots get 30-day windows with quota throttling; Kimi retires whole families in ~10 months. Any adopted non-Google id needs quarterly review.
9. **Unverified regional recall** — Qwen/GLM/Kimi Egyptian celebrity depth is unproven; a recall benchmark (Egyptian actors, footballers, singers) is a mandatory gate before any of them enters the generation route.
10. **JSON enforcement asymmetry** — only Gemini/OpenAI/Anthropic (+Kimi) offer schema-constrained decoding; routing extraction or judge to json_object-only providers (Qwen, DeepSeek, GLM) raises Zod-rejection/retry rates materially — acceptable for translation only, where the backend restores canonical fields.

---

## Top pick per step (synthesized)

- **extraction**: google:gemini-3.5-flash — GA workhorse with the 221-field schema already proven in production, native constrained-decoding structured output, top-tier vision, and paid-tier no-training privacy (anthropic:claude-sonnet-5 is the quality/privacy co-leader and the right cross-provider fallback).
- **generation**: google:gemini-3.5-flash — the only GA model combining best-in-class Egyptian/Arab celebrity recall with documented willingness to reason about public figures in input photos (OpenAI/Anthropic refuse; gemini-3.1-pro-preview is the max-recall escalation behind fallback).
- **judge**: google:gemini-3.5-flash at thinking_level high — GA, vision, structured output, no person-in-photo refusal friction for the safety-critical step; gemini-3.1-pro-preview as quality upgrade and anthropic:claude-sonnet-5 (text-only over trait evidence) as the conservative cross-provider fallback.
- **translation**: google:gemini-3.1-flash-lite — $0.25/$1.50, ~311–382 tok/s with ~4.8s TTFT, GA until at least May 2027, top-tier Arabic, structured output; alibaba:qwen-flash ($0.05/$0.40) is the cheapest acceptable alternative.

## Adapter implementation strategy

Build three adapters, in this order. (1) FIRST: keep and harden the existing native Gemini adapter (@google/genai) as the primary path — it carries every step in the recommended routes, and Gemini's OpenAI-compat endpoint is beta, so the native SDK must stay authoritative; extend it with per-step env-driven model id + thinking_level caps and a billing-active (paid-tier) assertion per key so photos never hit a free-tier key. (2) SECOND: one generic OpenAI-compatible adapter parameterized by config (baseUrl, apiKey, model, capability flags: supportsJsonSchema, supportsVision, thinkingParamStyle, maxOutputTokens) — this single adapter covers OpenAI (api.openai.com), DeepSeek (api.deepseek.com), Qwen/DashScope (dashscope-intl.aliyuncs.com/compatible-mode/v1), Kimi (api.moonshot.ai/v1), Z.ai (api.z.ai/api/paas/v4), and even Gemini's compat endpoint as an emergency shim — i.e., ~6 providers for the price of one integration. Its first production use is the translation fallback (openai:gpt-5.4-nano or alibaba:qwen-flash) and offline recall/refusal benchmarking of Qwen/GLM; gate json_object-only providers (Qwen/DeepSeek/GLM) to translation because they lack schema-constrained decoding. (3) THIRD: a native Anthropic Messages adapter (@anthropic-ai/sdk) — required because Anthropic's OpenAI-compat layer does NOT support structured outputs, which this pipeline needs; it unlocks claude-sonnet-5 as the extraction fallback (best photo privacy: ephemeral images, never trained on) and as the text-only judge fallback. Route selection stays env-driven per step (PROVIDER:MODEL pairs, GEMINI_MODEL-style) and plugs into the existing content-level model-fallback mechanism; add per-provider capability metadata so the router can refuse to send the photo to any adapter/config not flagged photo-safe (hard-code Kimi and DeepSeek as photo-forbidden).
