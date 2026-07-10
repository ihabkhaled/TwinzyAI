# Skill: Clean Up AI-Safety & Upload Code Without Weakening It

Refactor the privacy/safety-critical surfaces — upload chain, image handling, AI safety filters, provider adapters — so they get simpler while their guarantees stay byte-for-byte intact.

## Read first

- [rules/14-ai-safety.md](../rules/14-ai-safety.md) · [rules/15-file-upload-security.md](../rules/15-file-upload-security.md) · [rules/30-refactor-discipline.md](../rules/30-refactor-discipline.md)
- The invariants in [/CLAUDE.md](../CLAUDE.md) "Twinzy Product Constraints"

## When to use

Any refactor touching: `modules/file-security`, `modules/privacy`, `modules/ai` (safety service, adapters, prompt repository), image buffer lifecycle, or the game use-cases' `finally` blocks. When NOT to use: for behavior CHANGES to these surfaces — those are features with full SDLC artifacts, not cleanups.

## Steps

1. Before touching anything, write down the invariants the file enforces: consent-first, validation order, fail-closed paths, wipe-in-`finally` immediately after extraction, no-image-logging, extraction as the sole image-provider call, text-only generation/judging/translation, Zod + forbidden-wording filtering, redaction.
2. Run the surface's focused suites FIRST and record the pass state (`npm run test:file-security`, `npm run test:ai`, `npm run test:security`).
3. Refactor with behavior-identical moves only: rename, extract pure helper, move declaration to owner, split by responsibility. Never reorder validation steps; never widen a catch; never make a fail-closed path fail-open; never move image bytes across a boundary.
4. Diff-review your own change asking one question per invariant from step 1: "is this still enforced on every path?" Confirm `AI_IMAGE_STEPS` contains extraction only and the pipeline tests record one image call followed by text calls.
5. Re-run the same suites + the integration suite; any behavioral diff = revert and rethink.

## Checklist

- [ ] Invariants listed before editing; each re-verified after
- [ ] Validation order, `finally` cleanup, and fail-closed semantics unchanged
- [ ] No image/base64/prompt-payload value became loggable or persistent
- [ ] Focused + integration suites green before AND after; zero coverage removed

Related: [simplify-existing-code.md](./simplify-existing-code.md) · [full-codebase-cleanup.md](./full-codebase-cleanup.md)
