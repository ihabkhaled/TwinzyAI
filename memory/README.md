# memory/ — Decisions Already Made

Read before proposing changes: these are settled decisions with reasons. Update the relevant
file when a decision changes — do not silently contradict it. When memory and a rule under
[/rules](../rules/README.md) disagree, the rule wins; fix the memory file.

| File | One line |
| --- | --- |
| [ai-context-map.md](./ai-context-map.md) | The fixed read order for agents (CLAUDE.md → architecture-map → rules/00 → layer rule + skill → known-pitfalls) and the task→rule/skill routing tables. |
| [ai-safety-decisions.md](./ai-safety-decisions.md) | Three-prompt pipeline, the image-capable vs text-only port split, strict zod response contracts, GEMINI_MODEL from env. |
| [architecture-decisions.md](./architecture-decisions.md) | Engineering-OS adoption (ADR-001/-002), manager→use-case, common/→core/, additive-messageKey error envelope, workspace decisions. |
| [backend-stack.md](./backend-stack.md) | The locked api toolchain: NestJS 11 on Fastify 5, pino/AppLogger, zod-only validation, tsgo, ESLint 9 + architecture plugin, Vitest 4, husky/commitlint/Trivy gates. |
| [database-decisions.md](./database-decisions.md) | Standing decision: no database/persistence by design; any storage proposal needs an ADR + privacy review; images are never persisted, period. |
| [event-notification-decisions.md](./event-notification-decisions.md) | No events/queues/broker today; in-process fail-safe side effects only; adoption criteria if that ever changes. |
| [frontend-stack.md](./frontend-stack.md) | Next.js 16 / React 19 / Tailwind v4 stack — owned by the parallel frontend workstream. |
| [known-pitfalls.md](./known-pitfalls.md) | Recurring traps (strict TS, zod, DI, Fastify migration, tsgo, coverage, workspaces) in Symptom/Cause/Fix form — read before writing code. |
| [library-boundaries.md](./library-boundaries.md) | The vendor ownership map: which folder owns each external library, and the config-driven ESLint enforcement. |
| [observability-decisions.md](./observability-decisions.md) | pino behind the AppLogger port, structured redacted logs, request id on every line, 4xx→warn / 5xx→error. |
| [performance-decisions.md](./performance-decisions.md) | Fastify for throughput, hard Gemini timeout, deliberately sequential AI calls, 5 MB cap, no cache by design. |
| [privacy-decisions.md](./privacy-decisions.md) | The product-defining invariants: memory-only image, zero-fill in finally, no persistence, no biometrics, no payments. |
| [project-architecture.md](./project-architecture.md) | Standing decision: layered module-per-feature + core/config/bootstrap + packages/shared, with the concrete module list. |
| [release-checklist.md](./release-checklist.md) | The memory copy of the release gate: lint/typecheck/tests/coverage/build, Trivy, fastify dedupe check, forbidden wording. |
| [reliability-patterns.md](./reliability-patterns.md) | finally-based cleanup, fail-closed scanning, AbortController timeouts, fail-fast env, stateless instances. |
| [security-decisions.md](./security-decisions.md) | Fastify hardening plugins, throttling (30/min, analyze 10/min), ClamAV INSTREAM fail-closed, sanitized envelope, Trivy. |
| [testing-strategy.md](./testing-strategy.md) | Vitest 4 multi-project + SWC plugin, tests-first, naming/fixtures, the 95/90/95/95 coverage gate and its web waiver. |
| [ui-design-system-decisions.md](./ui-design-system-decisions.md) | Theme tokens, brand palette, mobile-first sizing, reduced motion — owned by the frontend workstream. |
