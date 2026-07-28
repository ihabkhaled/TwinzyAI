# Advanced Extraction Provider-Shape Recovery — 2026-07-28

## Summary

Twinzy's enhanced v6 written-trait flow now tolerates the bounded string shorthand observed from
Gemini without removing the structured matching and counterfactual profiles. Invalid or unsafe
extraction content advances through at most three configured model entries; exhaustion still
returns the existing friendly terminal error.

## Included Changes

- Clarified every enhanced Prompt 1 signal array with a complete structured-object example.
- Added narrow provider-boundary normalization followed by the unchanged strict schema and safety
  filter.
- Added unsafe-extraction fallback so a safe later model may complete the request.
- Strengthened enhanced-profile fixtures, safety leaf inspection, and direct multipart/SSE
  integration coverage.
- Fixed the API runtime image so npm workspace-local production dependencies are present.
- Recorded the critical lifecycle in
  [`docs/features/advanced-extraction-provider-shape-recovery/`](../docs/features/advanced-extraction-provider-shape-recovery/).

## Player Impact

Valid uploads should proceed from visible-trait extraction to candidate generation, judging, and
the final playful style/vibe result instead of stopping on the observed Gemini response shape.

## Operator Impact

- No new or changed environment variables, endpoint contracts, storage, or migrations.
- AI routes remain capped at three entries per step.
- Logs may report a count of normalized shorthand signals and a bounded forbidden-phrase reason;
  they never include image bytes, prompts, or provider response values.
- PayPal capture remains after a complete result. Paymob compensation behavior is unchanged.

## Known Limitations

- If all three configured entries return malformed, unsafe, unavailable, or timed-out content, the
  request ends with the existing localized AI error.
- External payment-provider authorization holds may remain visible temporarily even when PayPal was
  never captured.

## Rollout Notes

Push the hook-clean commit to `main`, wait for both Lint and Knowledge gates plus all other remote
checks, then verify the Vercel API health and runtime logs. Rollback is a focused `git revert` and
redeploy; no database or data migration exists.
