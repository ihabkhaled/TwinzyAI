---
id: ai-forbidden-wording
title: Forbidden Wording — Lists, Scanning, and Safe Change Procedure
type: doc
authority: canonical
status: current
owner: repository owner
summary: Where the en+ar forbidden phrase lists live, how the guard scans them, and the critical-lane procedure for changing them.
keywords: [ai, forbidden, wording, phrases, safety, arabic, english, scanning, critical-lane]
contextTier: 2
relatedCode: [packages/shared/src/constants/safety.constants.ts, apps/api/src/modules/ai/model/ai-safety.constants.ts, apps/api/src/modules/ai/lib/forbidden-wording.guard.ts]
relatedTests: [apps/api/src/modules/ai/tests/forbidden-wording.guard.test.ts, apps/api/src/modules/ai/tests/ai-safety.service.test.ts]
relatedDocs: [docs/ai-safety.md, docs/ai/safety-filters.md, rules/14-ai-safety.md]
readWhen: You need to add, remove, or debug a forbidden phrase, or understand why a response was rejected as unsafe.
---

# Forbidden Wording — Lists, Scanning, and Safe Change Procedure

**Policy owner:** [docs/ai-safety.md](../ai-safety.md) /
[rules/14-ai-safety.md](../../rules/14-ai-safety.md). Product constraint owner: `CLAUDE.md`
(Twinzy constraints #4/#5/#7 — no identity assertions, no sensitive inference).

## Where the lists live

- **Single source:**
  [`packages/shared/src/constants/safety.constants.ts`](../../packages/shared/src/constants/safety.constants.ts)
  - `FORBIDDEN_RESULT_PHRASES` — identity/lookalike/biometric phrasing ("face recognition",
    "biometric", "identity match", "exact lookalike", "you are ", "we identified", …), English
    **and** Arabic.
  - `FORBIDDEN_SENSITIVE_TOPICS` — ethnicity, religion, health, sexuality, attractiveness,
    income, age-estimate terms, English **and** Arabic.
- **Backend merge:** `apps/api/src/modules/ai/model/ai-safety.constants.ts` concatenates both
  into `ALL_FORBIDDEN_PHRASES` for the scanner. The shared package keeps frontend tests and the
  benchmark harness on the same vocabulary.

## How the guard scans

[`forbidden-wording.guard.ts`](../../apps/api/src/modules/ai/lib/forbidden-wording.guard.ts)
performs a **case-insensitive substring scan** of each text against every phrase. Consequences of
the substring semantics:

- A phrase matches inside longer words/sentences — prefer distinctive phrases; note deliberate
  trailing spaces (e.g. `"you are "`) to reduce false positives.
- No regex is involved — phrases are plain strings, immune to regex-injection concerns.

What gets scanned and what happens on a hit (reject vs drop) is owned by
[safety-filters.md](safety-filters.md) Layer 3. Server-owned `disclaimer`/`fallbackMessage`
fields are exempt from the benchmark's scan because the server always overwrites them
(`apps/api/src/benchmark/lib/benchmark-metrics.util.ts`).

## Changing the lists safely (critical lane)

Safety wording is a product non-negotiable; treat any change as critical-path work:

1. Edit only `packages/shared/src/constants/safety.constants.ts`; keep **en+ar parity** — every
   new concept needs phrases in both languages.
2. Mind the substring semantics: check the new phrase does not swallow legitimate trait
   vocabulary (skin tone / hair texture descriptors are allowed by policy).
3. Update/extend `apps/api/src/modules/ai/tests/forbidden-wording.guard.test.ts` and
   `ai-safety.service.test.ts` with the exact new phrase (positive + negative cases).
4. Run `npm run test:ai` (package.json:52) and `npm run ai:benchmark` (mock mode reuses the
   production guard — [docs/ai-benchmarking.md](../ai-benchmarking.md)).
5. Full gates: `npm run lint` · `npm run typecheck` · `npm run test:coverage` · `npm run build`
   (CLAUDE.md pre-merge gates).
6. Update [docs/ai-safety.md](../ai-safety.md) if the policy scope changed, and rebuild the
   knowledge plane (`npm run knowledge:build`, per
   [knowledge/README.md](../../knowledge/README.md)).
7. Removing or weakening a phrase requires an owner-recorded decision — the never-weaken rule in
   `CLAUDE.md` applies.
