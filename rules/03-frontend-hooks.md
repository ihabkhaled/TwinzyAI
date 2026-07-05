# 03 — Frontend Hooks

- Hooks own state, effects, and handlers; they call services, never gateways directly.
- Keep hooks thin: derive/transform via pure helpers in features/*/lib or utils/.
- Return a single object the component can spread as props.
- Name useXxx, live in hooks/ folders only. Mutations via TanStack Query; forms via React Hook Form.
