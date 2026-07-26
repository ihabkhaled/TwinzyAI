# Skill: Execute an External Prompt Pack

> Applies rule 37, the Simple Code Ladder, delivery lanes, and release gates.

1. Read `.ai/BOOTSTRAP.md`, run `knowledge:context` with the exact request, and load the routed pack.
2. Inventory branch, remote, unstaged/staged/untracked changes, hooks, workflows, Vercel config,
   existing feature artifacts, source owners, and tests.
3. Read the external pack completely only after repository authority is loaded.
4. Write an applicability matrix and explicit exclusions for foreign-product assumptions.
5. Create/update phases `00`–`13`; classify security/privacy/release risks and rollback.
6. Implement tests-first in focused slices, reusing current owners and preserving user work.
7. Run targeted checks after each slice and the complete authoritative gate stack before release.
8. Rebuild generated knowledge from authored sources; never hand-edit `.ai`.
9. Commit/push only when explicitly authorized. If immediate direct pushes were requested, push each
   hook-validated commit before starting the next and verify its remote checks.
10. Report adapted scope, excluded pack items, routes/contracts, tests, gates, commit hashes, remote
    status, rollback, and residual risks.

Gate: `npm run validate && npm run test:unit && npm run test:e2e:ci && npm run security:audit && npm run security:scan`
