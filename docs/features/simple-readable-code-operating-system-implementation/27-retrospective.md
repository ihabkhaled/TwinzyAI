# 27 — Retrospective

## What went well

- Existing Simple Code owners were extended instead of creating dozens of duplicate rule/skill/docs.
- Independent audits found the decisive policy/runtime and Playwright root causes early.
- Tests were changed first for the image boundary; failures proved the old behavior before fixes.
- Knip-driven cleanup removed speculative exports/config while full gates caught real Docker,
  disclaimer, rate-limit, and coverage issues.
- Static enforcement now protects warning-free lint, exact controller delegation, service size,
  image-call ownership, tooling TypeScript, dead code, formatting, and cycles.

## What did not go well

- Canonical and historical guidance had drifted across product pivots and frontend migration docs.
- The initial lint/coverage/Docker claims were stronger than mechanical enforcement.
- A full-repo formatter exposed one pre-existing format drift and created noisy line-ending status
  observations on Windows.
- Strict enterprise artifact completion is much larger than the implementation itself.

## Improvements adopted

- New pitfalls record devtools overflow and policy/call-modality drift.
- Prompt version changes are treated as contract changes.
- Configuration ships only with a real consumer; second adapters precede selector config.
- Frontend logic participates in the root coverage gate.
- Node 22 Docker clean-install validation is part of evidence.

## Follow-ups

- Owner live-provider/Arabic UAT and client approval.
- Consider a justified full image-decoder adapter after dependency/security evaluation.
- Run production release/hypercare and then complete this retrospective with operational outcomes.
- No additional permanent `CLAUDE.md` change is needed beyond the policy revision already recorded.
