<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Package upgrades/additions/removals

Task type: `dependency-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Every meaningful library is wrapped (packages/<vendor> on web, adapters on api).
- New/upgraded deps pass npm run audit and the trivy scan; decisions recorded in docs/package-decisions.md.
- Lockfile changes ride with the dependency change, never separately.

## Must-read docs

- docs/package-decisions.md — Policy: latest compatible stable versions with caret ranges; compatibility verified against the (~467 tokens)
- docs/library-wrapping.md — Policy: every third-party library is wrapped in exactly one module; business code imports the (~145 tokens)

## Rules

- rules/10-library-modularization.md — > Every external library that touches product behavior is owned by **exactly one adapter/module**. Business code depends on *our* interface — never the vendor SDK. Swapping a vendor touches one folder. Implements rules 30 and 39 of [00-n... (~1544 tokens)
- rules/frontend/09-library-wrapping.md — Every third-party package has exactly **one owner**: a wrapper directory under (~1527 tokens)

## Skills

- skills/add-library.md
- skills/create-package-wrapper.md
- skills/modularize-existing-library.md

## Reviewers

- agents/backend-release-gatekeeper.md

## Code entrypoints

- `package.json`
- `package-lock.json`

## Validation before done

- `npm run audit`
- `npm run validate`

## Notes

Prefer extending an existing wrapper over adding a vendor. Overrides in the root package.json are deliberate — read the comments before touching.
