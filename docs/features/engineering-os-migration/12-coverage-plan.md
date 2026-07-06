# 12 — Coverage Plan

- **Thresholds (hard, vitest):** statements 95 / branches 90 / functions 95 / lines 95.
- **Gated scope:** apps/api logic-bearing files (core error mapper/filter, validation factory, logger service, application/, infrastructure/, lib/, adapter logic) + packages/shared/src. Wiring-only files (modules, main, bootstrap assembly, dto/model type files) excluded per testing/coverage-policy.md; web files excluded until the web workstream adopts the gate (recorded waiver, owner: web workstream).
- **Branch floor 90 (not 95):** absorbs the uncoverable synthetic branch the decorator downlevel emits per @Injectable/@Catch class line; every real branch must be covered.
- **Critical scenario areas near 100%:** file-security chain, ai safety filtering, game use-case buffer-wipe guarantees.
