# 09 — Impact Analysis

## Affected systems and teams

- Root policy/mirrors/rules/skills/context/memory/docs: wording and navigation alignment.
- API AI/game/config/benchmark: call modality and image-step capability.
- Shared: current duplicate/dead declaration cleanup and exports.
- Web: result-state mobile layout and E2E harness.
- ESLint/CI: warning-free enforcement and Playwright gate.
- QA/security/support/release: new evidence and superseded pivot guidance.

## Compatibility and migration

Request/response field shapes and the error envelope remain stable, but `promptVersion` is
intentionally bumped to `written-traits-v5`; v4 results are not accepted as v5. API and web must
deploy together. No database, durable-cache schema, seed, backfill, or generated-client migration
exists. Provider config remains readable; generation/judge routes no longer require vision.

## Monitoring and operations

Existing safe pipeline milestone logs remain; no payload logging is added. Deployment health and mocked E2E are sufficient for this no-infrastructure change. AI quality should be watched during UAT because text-only matching may alter rankings.

## Support and training

Support language must describe written visible-trait matching only. Contributors/agents follow the existing Simple Code Ladder and declaration ownership map.

## Privacy, security, compliance

Privacy exposure is reduced. Consent, upload checks, memory-only handling, cleanup, redaction, rate limits, and output filtering are unchanged or strengthened. No protected data is added.

## Other checklist areas

Auth/tenant isolation, payments, persistence, queues, migrations, analytics, ingress, Docker topology, and legal terms are not changed. CI, tests, docs, and release notes are affected and must be updated/evidenced.
