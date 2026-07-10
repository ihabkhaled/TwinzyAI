# 03 — Product Requirements

## Epic and user stories

As a player, I want my photo used only for visible-trait extraction and destroyed after the request so the game matches its privacy promise. As a 320 px mobile user, I want every result screen to fit without horizontal scrolling. As a contributor or AI agent, I want obvious ownership and strict feedback so I can make safe changes quickly.

## Acceptance criteria

1. Image + consent enters the validated upload flow; only extraction receives `AiImageInput`.
2. Candidate generation, judging, translation, sharing, and frontend display are text-only by API shape and regression test.
3. Image buffers remain memory-only and are zero-filled in `finally` on every path.
4. No identity, face-recognition, biometric, exact-lookalike, or sensitive-inference claims are allowed.
5. Existing Simple Code Ladder, ownership, review, and mirror guidance is complete and internally consistent without duplicate owners.
6. Lint reports zero warnings/errors; strict TS and existing rules are not weakened.
7. The 320 px full game flow has no document-level horizontal overflow in both CI Chromium projects.
8. Tests, docs, and public exports match the refactored code.

## In scope

Governance alignment, focused static-enforcement cleanup, backend AI-boundary refactor, frontend overflow fix, shared/dead-code cleanup already present in the worktree, tests, and validation artifacts.

## Out of scope / non-goals

Payments, auth, persistence, new AI providers, redesign, schema migration, speculative abstractions, and unrelated formatting churn.

## UX, errors, permissions, analytics, localization

No auth/permission change. Existing loading/error/cancel/retry states, accessibility, English/Arabic localization, and RTL behavior remain. No new analytics. Provider failures keep the existing safe error envelope.

## Product definition of done

The acceptance criteria are covered by executable evidence, all applicable gates are green, rollback is documented, and no safety or accessibility regression is known.
