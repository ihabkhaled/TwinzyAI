<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/bootstrap.md, knowledge/context-budget-policy.yaml, knowledge/contradiction-checks.yaml -->


# TwinzyAI — Agent Bootstrap

Twinzy is a **free-by-default, privacy-first, mobile-first AI style/vibe game** (Next.js web +
NestJS/Fastify API + `@twinzy/shared` contracts). A player uploads one photo **after explicit
consent**; the app extracts written visible traits, then suggests playful public style/vibe
matches. It never says who the user is.

## Non-negotiable invariants (verified in code; violating any is an automatic stop)

1. **Consent-first.** Backend requires literal consent `'true'` before anything else
   (`file-security.service.ts` checks consent first); UI blocks submit without the checkbox.
2. **Image lifecycle.** The photo lives in request memory only, is zero-filled in `finally` on
   success/failure/abort, and reaches **only** trait extraction. Candidates, judging,
   translation, sharing, display are **text-only** — no image, hash, crop, or embedding ever
   flows downstream, and the image is never logged or persisted.
3. **No identity or sensitive inference.** No who-you-are, lookalike, biometric, ethnicity,
   religion, health, sexuality, attractiveness, or income claims. Enforced by shared forbidden
   lists (`packages/shared/src/constants/safety.constants.ts`), `AiSafetyService`
   reject/filter, and `z.literal(false)` judge safety flags.
4. **Every AI response is Zod-validated + safety-filtered** (all four steps: extraction,
   candidates, judge, translation). External REST bodies (PayPal) are Zod-parsed too.
5. **Models/caps come from env only** (`GEMINI_MODEL`, `AI_ROUTE_*`, per-step chains); an empty
   chain fails closed — never a hardcoded model id.
6. **Payments:** a recorded owner decision (2026-07-12,
   `docs/features/paypal-donations-and-paid-results/22-go-no-go.md`) permits an **env-gated**
   PayPal Orders v2 paywall — capture-at-consumption, server-authoritative price, no
   persistence. Blank credentials (the default) = fully free game. **LIVE mode is not
   approved** (4 recorded conditions open). The `paypal.me` donate link is env-driven and
   hidden when unset.
7. **Upload chain:** consent → presence → size → MIME/extension allowlists + consistency →
   magic bytes → decode → optional ClamAV **failing closed** whenever enabled.
8. **Strictness is frozen:** full-strict TypeScript, 0-warning ESLint, no `any`, no TS `enum`,
   no non-null `!`, **no inline eslint-disable ever**, no `@ts-ignore`. Never bypass hooks
   (`--no-verify` forbidden) and never weaken validation, safety filters, tests, or lint.

## Architecture (mechanically enforced)

- **API** `apps/api/src/modules/<m>`: Controller (thin, one delegation) → Application
  (use-cases orchestrate; services ≤20 lines/method) → Domain (pure) → Infrastructure →
  Adapters (every vendor wrapped; Gemini SDK only in `gemini.adapter.ts`). Cross-cutting:
  `core/`, `config/` (typed zod env), `bootstrap/`. Modules: ai, file-security, game, health,
  payments, privacy, result-aggregation, share-results.
- **Web** `apps/web/src`: `app/` (App Router) → `modules/<feature>`
  (components/containers/hooks/services/gateway/model) → `shared/` → `packages/<vendor>`
  (axios, paypal, i18n, zod, zustand… — the only vendor import points). TSX is composition;
  state in hooks; HTTP via gateway; all copy through i18n (en+ar, RTL).
- **Contracts** live in `packages/shared/src` (constants/enums/schemas/types). No inline
  types/constants/schemas in layer files. Reuse before creating (Simple Code Ladder,
  rules/28–30).

## Fast-task protocol (mandatory)

1. Classify the task (type, modules, lane: fast/standard/critical).
2. `npm run knowledge:context -- --task="<request>" [--files=a,b] [--diff=origin/main...HEAD]`
   → reads `.ai/local/current-context.md` (pack, exact docs/rules/skills, source, tests,
   validation commands).
3. Read the exact owner files + their tests (parallel). Never wander the repo.
4. Plan (objective, owner, files, contracts, steps, tests, risks, docs delta, rollback), then
   implement. Expand context only when evidence demands it.
5. Gates before "done": `npm run lint` · `typecheck` · `test:coverage` (≥95% touched) ·
   `build`; update canonical docs + `npm run knowledge:build` if knowledge inputs changed.

## Authority

`CLAUDE.md` (governance) → `context/architecture-map.md` + `rules/00-non-negotiable-rules.md`
(engineering canon) → `rules/` → ADRs + `memory/` → area canon (`structure/ product/ domain/
contracts/ testing/ operations/ support/ runbooks/ quality/`) → summaries (`context/`,
`.ai/summaries/`) → generated facts (`.ai/manifests|indexes|graphs`) → `docs/features/`
(temporary). Stricter rule wins. `.ai/` is generated — fix sources, never `.ai/` files.

## Current critical items

- **paywall-policy-supersession** — CLAUDE.md Twinzy constraint #1, rules/00 rule 42, and all agent mirrors still said "no payment capture ever", while an owner-approved 2026-07-12 supersession (docs/features/paypal-donations-and-paid-results/ 22-go-no-go.md: SANDBOX-GO, LIVE-conditional) shipped an env-gated PayPal Orders v2 paywall (capture-at-consumption, no persistence, webhooks optional).
- **paywall-live-conditions** — LIVE paywall is NOT approved.

Details: `.ai/HOT_MEMORY.md` (active facts) · `.ai/QUICK_ROUTER.md` (task→pack table) ·
`.ai/CURRENT_STATE.md` (repo shape) · `knowledge/README.md` (how this system works).
