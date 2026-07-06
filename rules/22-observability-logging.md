# 22 — Observability & Logging

> How Twinzy stays diagnosable without ever leaking what it exists to protect: the **AppLogger port only** (never `console.*`), structured logs at correct levels, a request id flowing through every line, and redaction that treats image data as radioactive. Implements rules 27 and 38 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Observability is **part of the change**, not an afterthought — a critical path with no log trail is incomplete work.

---

## 1. The AppLogger port — never `console.*`

All logging goes through `AppLogger` (`core/logger`), which wraps **nestjs-pino** — the engine is an implementation detail behind our port ([10-library-modularization.md](./10-library-modularization.md)); swapping it touches one folder. ESLint `no-console` is `error`; the adapter is the single sanctioned sink.

```ts
// Do — inject the port; constant message + structured metadata
this.logger.info('game.traitsExtracted', { requestId, count: traits.length });

// Don't
console.log('extracted', traits);                       // banned + leaks the payload
this.logger.info(`traits ${JSON.stringify(traits)}`);   // never stringify data into the message
```

Rules:

1. **The message is a constant dotted event name** (`game.pipelineStarted`, `fileSecurity.rejected`, `ai.judgeCompleted`); data goes in the metadata object — keeps logs queryable.
2. **Inject via constructor DI** (`private readonly logger: AppLogger`). The only file-local literal allowed is a `LOG_PREFIX`.
3. **Log identifiers and milestones, never payloads.** Pipeline milestones — validated, traits-extracted, candidates-generated, judged, aggregated — with request-scoped context; never the contents.
4. **Level comes from typed config**, never `process.env.LOG_LEVEL` ([25-configuration-and-environment.md](./25-configuration-and-environment.md)).

## 2. Redaction — pino paths + the image invariant

Engine-level redaction is configured on the pino instance and covers at minimum: `req.headers.authorization`, `req.headers.cookie`, `*.token`, `*.secret`, `*.apiKey`, `*.password`. Extend the path list in the same change that introduces any new sensitive field.

**The image invariant goes beyond redaction:** image **buffers and base64 strings must never reach the logger at all** — not redacted, *absent*. Never log `file.buffer`, data URLs, previews, or full prompts in production (the trait prompt embeds the image). Log `file.size` and `file.mimetype`, never contents. Raw provider errors are logged server-side (redacted) and never surface to users ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)).

```ts
// Do — metadata about the file, never the file
this.logger.info('fileSecurity.validated', { requestId, sizeBytes: file.size, mime: file.mimetype });
```

## 3. Request-id correlation

One request id joins every log line of a request: pino-http's `genReqId` generates a UUID (or honors an incoming request-id header — a constant, one scheme). It flows through request-scoped logging into every layer's lines and into the error envelope's server-side log entry, so a user report joins the trail without exposing internals. Never use the request id for anything auth-shaped — tracing only.

## 4. Levels — 4xx warn, 5xx error

| Level | Use for | Example |
| --- | --- | --- |
| `error` | Every `catch` before rethrow/fallback; 5xx-mapped failures; provider down | `ai.generate.failed` |
| `warn` | Client-driven rejections (validation, upload chain, rate limit) — everything 4xx-mapped; degraded fallbacks | `fileSecurity.rejected` |
| `info` | Side-effecting success: pipeline milestones, outbound call completed | `game.judged` |
| `debug` | Entry tracing, non-sensitive internals (off in production) | `game.stageEntry` |

The exception filter follows the same mapping: **4xx → `warn`, 5xx → `error`** — a flood of 404s must never drown a real alert. Every `catch` logs before rethrow/fallback; **no empty `catch {}`** — if "ignore" is truly intended, log `debug` with the reason. Narrow `catch (error: unknown)` (via a `toLogError`-style helper) before logging.

## 5. What each layer logs

| Layer | Logs | Never |
| --- | --- | --- |
| Controller | nothing manual — pino-http records method/path/status/duration | bodies, business detail |
| Use case / service | milestones, branch outcomes, every `catch` | payloads, prompts, buffers |
| Adapter | call start (`debug`), success + `durationMs` (`info`), failure + `durationMs` (`error`) | keys, prompt/image contents, raw vendor bodies |
| Frontend | user-facing errors via the error UI; no PII to any console | image data, anything identifying |

## 6. Verify the trail (part of Definition of Done)

After integration tests and after deploy: the expected `info` milestones appear at the correct levels; every exercised `catch` produced its line; the request id is identical across a request's lines; **grep the captured output for anything image-shaped or secret-shaped — it must be absent**, and redacted fields show as redacted. A feature is not verified until its log trail is.

---

## Checklist

- [ ] `AppLogger` injected everywhere; zero `console.*`
- [ ] Constant event-name messages + structured metadata; milestones/ids, never payloads
- [ ] Pino redaction paths cover authorization/cookie/token/secret/apiKey (+ new fields as added)
- [ ] No image buffer/base64/full prompt can reach a log line on any path
- [ ] Request id (UUID `genReqId`) threaded through all lines of a request
- [ ] 4xx → `warn`, 5xx → `error`; every `catch` logs; none empty; `unknown` narrowed
- [ ] Log level from typed config
- [ ] Trail verified after tests and after deploy — evidence noted in the change
