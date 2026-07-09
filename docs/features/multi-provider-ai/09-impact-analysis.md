# 09 - Impact Analysis

| Area | Impact |
| --- | --- |
| Backend AI module | Router + registry + capability model added; Gemini adapter unchanged in behavior; step services unchanged (they already declare steps and consume the port) |
| Config | New optional env vars (routes, provider creds/base-urls/enable flags, capabilities, shadow, benchmark); zod-validated fail-fast; absent vars = current Gemini-only behavior |
| Shared package | None to response contracts. Provider/route vocabulary stays backend-owned (frontend must never see provider details) |
| Frontend | None. Streaming, language switching, cancel, stream isolation untouched |
| Public API | None — same endpoints, same envelopes, same error codes |
| Tests | New router/registry/capability/adapter/config/benchmark tests; existing tests keep passing (FakeAiAdapter implements the same port) |
| Security/privacy | Image-step routing fail-closed to vision-declared entries only; provider keys backend-env only; no content logging; shadow metrics-only. Photo goes ONLY to providers the operator explicitly declared vision-capable |
| Performance | Router adds O(1) dispatch; concurrency caps/timeouts/queue unchanged; shadow sampled + budgeted + non-blocking |
| Operations | New runbook material in docs/provider-routing.md; per-step "served by provider:model" logs; rollback = env change only |
| Docs | provider-routing, benchmarking, env vars, memory decisions (see 23) |
| Backward compatibility | Full: Gemini-only config remains a valid production configuration; existing GEMINI_* vars keep their meaning |

Migration: none (no data). Rollout: providers ship disabled by default; enabling any non-Gemini provider is an explicit env action. Rollback: unset/reset env → previous behavior.
