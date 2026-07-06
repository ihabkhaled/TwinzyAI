> Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference.

# 04 — Frontend Services & Gateways

> Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rule 49) · [10-library-modularization.md](./10-library-modularization.md) (lib/http, lib/storage owners) · [21-dto-validation.md](./21-dto-validation.md) (shared schemas) · [12-i18n.md](./12-i18n.md) (messageKey mapping)

- Services orchestrate frontend business flow (validation, mapping, sequencing); no JSX, no React.
- Gateways do HTTP only, through the shared HTTP client wrapper (lib/http). No raw fetch/axios.
- Gateways validate response shapes with shared Zod schemas before returning.
- Services map backend DTOs to view models; components never touch raw backend responses.
