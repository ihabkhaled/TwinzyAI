# 20 - UAT / Live Accuracy Calibration (Visual-Similarity Pivot)

> Historical only. The 2026-07-10 extraction-only image policy supersedes this calibration target;
> do not use expected-name/photo-resemblance criteria as a current release gate.

- Feature: `visual-similarity-pivot` (owner-approved recognition pivot — see [00-intake.md](./00-intake.md))
- Status: **Harness ready; live rounds are owner-executed.**
- Why owner-executed: a live calibration round sends real photos to Gemini, so it requires a
  running API with a valid `GEMINI_API_KEY` and the owner's own photos. Results are not
  fabricated here — this document is the template to fill after running the harness.

## What "calibrated" means (the accuracy bar)

The pivot's goal is close, visually-grounded matches with honest confidence:

1. **Top-match confidence:** the rank-1 result's `finalStyleVibeFitScore` should reach the bar
   (default 90; `TOP_CONF_BAR`) for a clear, front-facing, good-quality photo. Low-quality or
   occluded photos are *expected* to score lower — that is the calibration working, not failing.
2. **Expected-name recall:** when the owner already knows who people compare them to, that name
   should appear in the returned pool, ideally near the top. Pass the name(s) via `EXPECT`.
3. **Region relevance:** with `LANG=ar`, the pool should surface regionally-relevant public
   figures (the region hint is locale-derived), not only global/Western names.
4. **Safety:** no result may contain identity/biometric/face-recognition wording (already
   enforced server-side by the safety filter; confirm none leaks into the printed reasons).

## How to run a round

```bash
# 1. Start the API with a real key (see docs/docker-local-dev.md), e.g. on :8080
# 2. Run the harness against your photos:
API_BASE=http://localhost:8080 EXPECT="<name people compare you to>" \
  npm run calibrate -- ./photos/me-front.jpg ./photos/me-side.jpg

# Arabic / regional pass:
LANG=ar npm run calibrate -- ./photos/me-front.jpg
```

The harness (`scripts/calibrate.mjs`) prints, per photo: traits read, the top matches with
score/confidence/verdict, PASS/below against the top-match bar, and expected-name recall. The
photo is never written to disk by the harness and is never stored by the API.

## Round log (fill after running)

| Round | Date | Photos | LANG | Rank-1 score(s) | Expected-name recall | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

## Written conclusions (fill after running)

- Accuracy vs. the bar:
- Expected-name recall (rank of the person you're usually compared to):
- Region relevance (ar):
- Any safety wording observed (should be none):
- Prompt/threshold tuning follow-ups (if any):

## Decision

- [ ] Calibrated — accuracy meets the bar across the sampled photos; ship as-is.
- [ ] Needs tuning — record the specific gap above and open a follow-up against this feature.
