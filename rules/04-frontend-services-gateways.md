# 04 — Frontend Services & Gateways

- Services orchestrate frontend business flow (validation, mapping, sequencing); no JSX, no React.
- Gateways do HTTP only, through the shared HTTP client wrapper (lib/http). No raw fetch/axios.
- Gateways validate response shapes with shared Zod schemas before returning.
- Services map backend DTOs to view models; components never touch raw backend responses.
