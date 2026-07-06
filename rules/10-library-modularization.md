# 10 — Library Wrapping & Modularization

> Every external library that touches product behavior is owned by **exactly one adapter/module**. Business code depends on *our* interface — never the vendor SDK. Swapping a vendor touches one folder. Implements rules 30 and 39 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) · [25-configuration-and-environment.md](./25-configuration-and-environment.md) · [/skills/add-library.md](../skills/add-library.md) · [/skills/modularize-existing-library.md](../skills/modularize-existing-library.md) · [/memory/library-boundaries.md](../memory/library-boundaries.md)

---

## Why wrap (the five reasons)

| Reason | What the owning module centralizes |
| --- | --- |
| **Central config** | Keys, models, timeouts — read once from typed config, never re-read by callers |
| **Hardening** | Timeouts, aborts, fail-closed behavior, redaction live in one place |
| **Consistent errors** | Vendor exceptions become typed `AppError`s (`IntegrationError` + `messageKey`); vendor shapes never escape |
| **Test doubles** | One mock surface per dependency; callers mock the port, the adapter's tests mock the SDK — no network in tests |
| **Swap surface** | Replacing the AI provider or logger edits one folder, not forty call sites |

---

## The vendor ownership table

This table is the law. Each package is importable **only** in its owning location — enforced by ESLint via [`eslint/package-boundaries.config.mjs`](../eslint/package-boundaries.config.mjs) (plus `architecture/no-raw-library-imports` and `architecture/no-direct-sdk-imports`). Anywhere else, the import is a lint **error**.

| Package(s) | Owning location | Notes |
| --- | --- | --- |
| `nestjs-pino`, `pino`, `pino-http`, `pino-pretty` | `apps/api/src/core/logger` | Exposed as the `AppLogger` port; engine swap touches this folder only |
| `zod` | `packages/shared` + `apps/api/src/core/validation` + `src/config` + module `api/dto/` + `model/` schemas | The validation vendor — sanctioned in schema homes only, never ad-hoc in services |
| `@nestjs/swagger` | `apps/api/src/core/openapi` + `src/bootstrap` | Flag-gated; off in production by default |
| `@nestjs/throttler` | `apps/api/src/core/rate-limit` | Limits from typed config |
| `@nestjs/config` | `apps/api/src/config` | Exposed as `AppConfigService` — the only injectable config surface |
| `fastify`, `@fastify/*`, `@nestjs/platform-*` | `apps/api/src/bootstrap` | The only home of the HTTP platform; nothing else touches it |
| `@google/genai` | `apps/api/src/modules/ai/adapters` | `GeminiAdapter` — the only file importing the SDK |
| ClamAV clamd TCP client | `apps/api/src/modules/file-security/adapters` | Fail-closed policy lives here |
| `dotenv` | `apps/api/src/config` | Env loading is a config concern |
| `multer` (memory storage) | upload boundary wiring only | Memory storage only — see [15-file-upload-security.md](./15-file-upload-security.md) |
| HTTP clients (`axios`, `got`, `undici`, raw `fetch` server-side) | **forbidden** | No owning adapter exists (`core/http` is the reserved home); adding one requires the adapter + docs first |
| Frontend: HTTP | `apps/web/src/lib/http` | Gateways consume the wrapper; zod-validate responses |
| Frontend: browser storage | `apps/web/src/lib/storage` | No raw `localStorage`/`sessionStorage` |
| Frontend: config | `apps/web/src/lib/config` | `NEXT_PUBLIC_*` only |

When you add a dependency: add it to the boundaries config **in the same change**, record the package → owner mapping in [/memory/library-boundaries.md](../memory/library-boundaries.md), and justify it in [docs/package-decisions.md](../docs/package-decisions.md).

---

## The adapter shape (three pieces, in order)

1. **Port interface** — a small, intention-revealing contract we own. Owned input/output types only; **no vendor types cross it**. Lives in `model/<name>.types.ts` or `packages/shared/src/types`.
2. **Implementation** — the single `@Injectable()` adapter that imports the SDK, reads its typed config, applies timeouts/hardening, maps results to owned types, and maps failures to typed `AppError`s.
3. **Module wiring** — bind and export the port so consumers inject the interface, not the concrete class.

```ts
// modules/ai/adapters/gemini.adapter.ts — the ONLY file importing the SDK
import { GoogleGenAI } from '@google/genai'; // ← allowed only here

@Injectable()
export class GeminiAdapter implements AiProviderPort {
  public async generate(input: PromptInput): Promise<RawModelOutput> {
    try {
      return this.toOwnedOutput(await this.callWithTimeout(input));
    } catch (cause) {
      this.logger.error('ai.generate.failed', { stage: input.stage }); // no prompt/image data
      throw new IntegrationError('AI provider failed', 'errors.ai.providerFailed', undefined, cause);
    }
  }
}
```

Adapter rules:

- Config via the injected typed namespace — the adapter never reads `process.env` (`GEMINI_MODEL` comes through config, never a literal).
- Resilience (timeout via `AbortController`, any capped retry) lives **inside** the adapter ([08-reliability-durability.md](./08-reliability-durability.md)).
- Vendor failures → `IntegrationError` with **redacted** provider text; the raw error goes to server logs only.
- No inline types/constants in the adapter file — port + constants live in `model/` (rules/05).
- Callers mock the port; the adapter's own tests mock the SDK; no real network in any test ([09-testing-coverage.md](./09-testing-coverage.md)).

---

## Checklist

- [ ] No vendor package imported outside its owner in the table (lint 0/0 proves it)
- [ ] New dependency: boundaries config + adapter + port + tests + docs + config wiring in one change
- [ ] Port owns its types; no vendor types or string unions cross the boundary
- [ ] Adapter maps failures to `IntegrationError` + `messageKey`; nothing vendor-shaped leaks
- [ ] Adapter takes typed config; never `process.env`
- [ ] HTTP client absent until `core/http` exists as its owner
- [ ] Mapping recorded in [/memory/library-boundaries.md](../memory/library-boundaries.md)
