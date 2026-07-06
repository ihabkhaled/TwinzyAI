> Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference.

# 03 — Frontend Hooks

> Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rule 49) · [02-frontend-components-tsx.md](./02-frontend-components-tsx.md) · [04-frontend-services-gateways.md](./04-frontend-services-gateways.md) · [/skills/create-hook.md](../skills/create-hook.md)

- Hooks own state, effects, and handlers; they call services, never gateways directly.
- Keep hooks thin: derive/transform via pure helpers in features/*/lib or utils/.
- Return a single object the component can spread as props.
- Name useXxx, live in hooks/ folders only. Mutations via TanStack Query; forms via React Hook Form.
