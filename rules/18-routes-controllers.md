# 18 — Routes & Controllers

- HTTP only: route decorators, guards/interceptors/pipes, request binding.
- Exactly one manager call per handler; the body is a single delegation statement (lint-enforced).
- No business/AI/file logic, no SDK or repository imports, no process.env, no inline DTOs.
- DTO validation happens in pipes/schemas (dto/ folder), not in the controller body.
