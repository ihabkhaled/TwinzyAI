# Release Notes Template

## Summary

[What changed in plain language — for players, this is about the game experience; for operators, about the stack.]

## Included Changes

- [Change 1 — link the request folder `docs/features/<feature-slug>/`]
- [Change 2]

## Player Impact

[Who is affected and how. Remember the wording rules: playful style/vibe language only — never anything that reads as face recognition, identity matching, or biometrics.]

## Operator Impact

[What support and operations need to know: new/changed env variables, log shape or messageKey changes, endpoint or envelope changes, runbook updates.]

## Known Limitations

- [Limitation 1 — mirror anything support-relevant into `support/` known issues]

## Rollout Notes

[Deploy method (`docker compose up -d --build`), flags or staged rollout if any, smoke test reference (`runbooks/release-smoke-test.md`), and rollback note (git revert of the release slice + redeploy — no DB migrations exist).]
