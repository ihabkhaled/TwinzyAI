# Release Checklist (memory copy)

Canonical gate: [/rules/24-release-gate.md](../rules/24-release-gate.md) ·
[/testing/quality-gates.md](../testing/quality-gates.md) ·
skill [final-validation.md](../skills/final-validation.md).

Quick list:

- `npm run lint` (0 errors, 0 warnings) · `npm run typecheck` (tsgo for api) ·
  `npm run test:unit` · integration · e2e · `npm run test:coverage`
  (95/90/95/95 on the gated scope) · `npm run build` (after `build:shared`).
- `npm run security:scan` — Trivy, zero HIGH/CRITICAL.
- `npm ls fastify` shows ONE deduped version (after any install/dependency change).
- Husky hooks ran (pre-commit lint-staged+typecheck, commit-msg conventional, pre-push
  coverage+build) — never bypassed.
- Docker rebuild/up/down healthy; manual QA
  ([/docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md)).
- No secrets in bundle; `.env.example` current; no forbidden wording (privacy-violating terms,
  no payment language, no reference-workspace naming).
- apps/web untouched by backend changes; root config diffs additive only.
- Memory/docs updated in the same change as the behavior they describe.
- Do not commit or push unless asked.
