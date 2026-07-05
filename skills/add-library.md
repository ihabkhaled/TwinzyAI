# Skill: Add a Library

> Applies rules/10. Every library is wrapped; swapping = one folder.

1. Vet before install: maintenance health, CVEs (npm audit / Trivy), license, transitive count.
2. Document the decision in docs/package-decisions.md (chosen + rejected alternatives).
3. Install with a caret range in the right workspace; commit the lockfile change.
4. Create the wrapper: web -> lib/NAME/; api -> adapters/ or infrastructure/NAME/.
   Expose a small typed API; never leak vendor types.
5. Register the raw package in eslint/architecture-plugin/shared/policy-utils.mjs so direct
   imports fail lint. 6. Record it in memory/library-boundaries.md. 7. Test the wrapper.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
