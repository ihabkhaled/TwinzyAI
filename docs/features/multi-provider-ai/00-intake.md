# 00 - Intake: Multi-Provider AI Routing

- Request ID: `multi-provider-ai`
- Title: Provider-agnostic AI routing — best provider/model per pipeline step, with fallbacks, shadow mode, and benchmark-based selection
- Type: feature (architecture evolution)
- Source: product owner (2026-07-09, written directive)
- Owner: Engineering (AI-assisted)
- Severity/Urgency: high value / normal track
- Affected domains: backend AI module (`apps/api/src/modules/ai`), config (`apps/api/src/config`), shared contracts, docs, tests. Frontend untouched by design (provider details never reach the client).
- Critical-risk flags: touches AI behavior and photo handling (privacy!), external integrations, env/config surface. No money flow, no auth, no persistence.

## Initial scope statement

Make each pipeline step (trait extraction, candidate generation, judge, translation) routable to a different AI provider/model, chosen by evidence (research + internal benchmark), with per-step fallback chains, capability validation (image steps may only route to vision-capable providers), optional shadow execution for offline comparison, and production-safe env-driven defaults. Gemini remains the default and the app must keep running with a Gemini-only config. Rollback is env-only.

## Non-negotiables inherited (CLAUDE.md)

Free game; consent-first; zero image persistence; no identification; no sensitive inference; every AI output Zod-validated + safety-filtered; models/providers exclusively env-driven; no TS `enum`; upload chain untouched.

## Business analysis (compressed 01/02)

- Problem: one vendor = one failure domain (quota, outage, deprecation — e.g. gemini-2.0-flash retirement burned a dead fallback hop), one price curve, and one quality ceiling per step. The four prompts have sharply different difficulty; paying flagship prices for the easy step and accepting single-vendor risk on the hard steps is both wasteful and fragile.
- Desired state: per-step provider/model routing chosen from evidence, cross-provider resilience, cost control on easy steps, and an internal benchmark that turns provider choice from opinion into measurement.
- Success metrics: (1) app runs unchanged on Gemini-only config; (2) any step re-routable to a second provider by env change only; (3) invalid routing (image step → text-only provider) is impossible by construction; (4) `npm run ai:benchmark` produces a per-step report in mock mode with zero API keys; (5) all gates stay green.
- Commercial: free product — value is reliability + cost reduction + provider-negotiation freedom. No contract/SLA impact.
