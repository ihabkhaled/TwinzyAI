<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/routing-map.yaml -->

# Quick router — task type → lane, pack, first read

Classify the task, open the pack, then run
`npm run knowledge:context -- --task="<request>"` for the full resolved context.

| Task type | Lane | Pack | First read |
| --- | --- | --- | --- |
| `routine-fix` | fast | `.ai/packs/fast-routine-fix.md` | context/architecture-map.md |
| `backend-feature` | standard | `.ai/packs/backend-feature.md` | context/architecture-map.md |
| `frontend-feature` | standard | `.ai/packs/frontend-feature.md` | rules/frontend/00-non-negotiable-rules.md |
| `full-stack-feature` | standard | `.ai/packs/full-stack-feature.md` | context/architecture-map.md |
| `refactor` | standard | `.ai/packs/refactor.md` | rules/30-refactor-discipline.md |
| `production-bug` | standard | `.ai/packs/production-bug.md` | memory/known-pitfalls.md |
| `architecture-change` | critical | `.ai/packs/architecture-change.md` | context/architecture-map.md |
| `ai-pipeline-change` | critical | `.ai/packs/ai-pipeline-change.md` | context/ai-context.md |
| `ai-provider-change` | critical | `.ai/packs/ai-provider-change.md` | docs/provider-routing.md |
| `ai-prompt-change` | critical | `.ai/packs/ai-prompt-change.md` | docs/ai-safety.md |
| `upload-security-change` | critical | `.ai/packs/upload-security-change.md` | rules/15-file-upload-security.md |
| `privacy-change` | critical | `.ai/packs/privacy-change.md` | docs/privacy-and-data-retention.md |
| `payments-change` | critical | `.ai/packs/payments-change.md` | docs/features/paypal-donations-and-paid-results/22-go-no-go.md |
| `api-contract-change` | critical | `.ai/packs/api-contract-change.md` | context/declaration-ownership-map.md |
| `configuration-change` | standard | `.ai/packs/configuration-change.md` | docs/env-vars.md |
| `performance-change` | standard | `.ai/packs/performance-change.md` | rules/07-performance-scalability.md |
| `reliability-change` | standard | `.ai/packs/reliability-change.md` | rules/08-reliability-durability.md |
| `accessibility-change` | standard | `.ai/packs/accessibility-change.md` | rules/13-accessibility.md |
| `localization-change` | standard | `.ai/packs/localization-change.md` | rules/12-i18n.md |
| `dependency-change` | standard | `.ai/packs/dependency-change.md` | docs/package-decisions.md |
| `testing-change` | fast | `.ai/packs/testing-change.md` | testing/testing-strategy.md |
| `support-change` | fast | `.ai/packs/support-change.md` | support/README.md |
| `release` | critical | `.ai/packs/release.md` | docs/release-checklist.md |
| `rollback` | critical | `.ai/packs/rollback.md` | runbooks/rollback-template.md |
| `incident` | critical | `.ai/packs/incident.md` | runbooks/README.md |
| `knowledge-change` | standard | `.ai/packs/knowledge-change.md` | knowledge/README.md |
