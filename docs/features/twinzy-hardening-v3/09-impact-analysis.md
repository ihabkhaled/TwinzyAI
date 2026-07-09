# 09-impact-analysis.md — TwinzyAI Hardening v3

## Affected systems

- `apps/api` — analyze, analyze-stream, cancel, translate-result endpoints; prompts; AI services; result aggregation; file security.
- `apps/web` — upload flow, result-count UI, game hooks/services/gateways, result cards, i18n, error states.
- `packages/shared` — schemas, constants, types, enums.
- `eslint/` — custom rule tests, magic-number enforcement.
- `testing/` — Vitest and Playwright coverage.
- `docs/` — governance, security, test cases, runbooks, ADRs.
- Docker build pipeline — no changes unless dependency upgrades require image rebuilds.

## Affected teams

- Engineering (backend, frontend, shared)
- QA automation
- Security
- DevOps/SRE (observability and scaling docs)
- Support (new error states and result-count behavior)

## Backward compatibility

- Omitting `resultCount` defaults to 10, so existing clients are compatible but receive a different count than before (5 → 10).
- If strict API behavior is preferred, the backend can reject invalid counts instead of falling back. This is a product decision.
- Shared schema refinements (e.g., `traitCount` enforcement) may break existing test fixtures that did not previously populate the field count correctly.

## Migration needs

- No database migration.
- Update test fixtures to emit prompt v3 and correct trait counts.
- Update frontend to import locale constants from shared instead of redefining them.
- Update docs to reflect new default result count and score meaning.

## Monitoring impact

- Add per-stage timing metrics (trait extraction, candidate generation, judging, translation).
- Track result-count distribution, score distribution, and fallback-message frequency.
- Monitor cancellation rate and model timeout rate during hypercare.

## Support impact

- New user-facing error states require i18n entries and support context.
- Support must understand that fewer than 10 results can appear due to safety/quality filtering.
- Score explanation and mismatch warnings need to be documented for support responses.

## Training impact

- Engineers must follow the new rule: result-count and score-calibration constants live in `packages/shared`.
- QA must know the new Playwright scenarios and mobile device projects.
- Security must know the Trivy/fallback scanner configuration.

## Compliance impact

- Privacy and safety commitments are strengthened, not weakened.
- No new legal or compliance obligations.
- Plaintext `.env` key remains a local-dev risk that must be rotated before production exposure.
