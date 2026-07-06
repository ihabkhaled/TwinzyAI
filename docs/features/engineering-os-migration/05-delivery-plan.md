# 05 — Delivery Plan

Workstreams (in order):
1. Governance/knowledge layers (claude.md brain + mirrors + copied folders adapted).
2. Tooling kit (commitlint, lint-staged file, editorconfig, coverage thresholds, tsgo, trivy/deps scripts, package boundaries).
3. Backend foundation slice (bootstrap/, core/, config/ on Fastify + pino).
4. Module slices smallest-first: health, privacy, result-aggregation, file-security, ai, game.
5. ESLint architecture plugin retarget + vendor boundaries + plugin tests.
6. Dependency upgrade + Trivy remediation.
7. Final gates + live smoke + docs/memory sync + retrospective.
Blockers: none known. Approvals: owner (implicit via mission). Rollback: per-slice git commits; each slice independently revertable.
