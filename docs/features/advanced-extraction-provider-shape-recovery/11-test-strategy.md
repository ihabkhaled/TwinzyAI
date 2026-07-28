# Test Strategy

## Red regressions

- Prompt contract: every matching/counterfactual array shows structured signal objects; modifiers
  are individual enum values.
- Provider normalization: exact string arrays from the production paths become conservative
  objects and pass strict parsing.
- Negative boundary: invalid non-string/non-object elements still fail.
- Safety: enhanced-profile and counterfactual text is included in the forbidden-wording sweep.
- Integration: payment-off multipart/SSE request uses a decoded JPEG fixture, invokes one image
  extraction and the generation/judge text steps, and returns a valid terminal result.

## Regression layers

Run shared/API unit tests, API integration, paywall integration, AI benchmark tests, web E2E,
security, build, lint, typecheck, coverage, and Knowledge gates.

