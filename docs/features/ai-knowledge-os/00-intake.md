# 00 — Intake: AI Knowledge Operating System

- **Request ID:** ai-knowledge-os
- **Title:** Transform TwinzyAI into an incrementally compiled, AI-native Knowledge Operating System
- **Type:** platform/knowledge infrastructure + permanent policy change
- **Source:** repository owner (2026-07-12 prompt superseding the previous knowledge-OS prompt)
- **Owners:** repository owner (approver); AI delivery agent (implementer)
- **Severity/urgency:** high value, no production-runtime impact (dev/CI tooling + docs only)
- **Affected domains:** documentation system, agent tooling, npm scripts, ESLint config
  (documented relaxations only), Husky pre-push, CI workflows, canonical policy texts
  (CLAUDE.md, rules/, mirrors), `.env.example`
- **Delivery track:** standard lane (new `knowledge/delivery-lanes.yaml`), with the policy-text
  reconciliation handled as a recorded-decision sync (see 09)
- **Critical-risk flags:** touches CLAUDE.md product-constraint wording (paywall) — but only to
  align it with the already-recorded owner decision in
  `docs/features/paypal-donations-and-paid-results/22-go-no-go.md`; no runtime behavior changes
- **Initial scope:** three knowledge planes (canonical / compiled `.ai/` / execution protocol),
  a deterministic knowledge compiler (`scripts/knowledge/`, 35 scripts), authored routing
  definitions (`knowledge/`), canonical area backfill (structure/product/domain/contracts/
  operations/incidents/quality/docs-ai/support/runbooks/summaries), context resolver +
  golden-task benchmark, hooks/CI gates, rules 31–36, mirror updates
- **Out of scope:** any `apps/api`/`apps/web`/`packages/shared` runtime change; the paywall
  LIVE conditions; i18n copy revision (recorded open in the contradiction registry)
