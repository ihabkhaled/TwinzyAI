# 08 — Reliability & Durability

> The operational playbook for not hanging requests, not leaking buffers, and not crashing the process. Every remote call is bounded and cancellable; every side effect is fail-safe; every workflow reaches a terminal state; shutdown is clean. Implements rules 36–37 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [07-performance-scalability.md](./07-performance-scalability.md) · [27-async-events-and-jobs.md](./27-async-events-and-jobs.md) · [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) · [/memory/reliability-patterns.md](../memory/reliability-patterns.md)

---

## 1. Timeouts with `AbortController` — every remote call

Every outbound call (Gemini, ClamAV socket) goes through its adapter, and the **adapter** owns the timeout. Use `AbortController` (or the socket's native timeout) so a hung dependency is actually cancelled, not just raced-and-abandoned.

```ts
// adapter-owned timeout — value from typed config, never inline
async generate(prompt: PromptInput): Promise<RawModelOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), this.config.geminiTimeoutMs);
  try {
    return await this.client.generate(prompt, { signal: controller.signal });
  } finally {
    clearTimeout(timer); // never leak the timer
  }
}
```

- A timeout surfaces as a typed `IntegrationError` with a `messageKey` — the user gets a friendly, actionable error, never a hung spinner.
- Retries only where idempotent and transient — capped, backed off, adapter-owned. **The analyze pipeline is not auto-retried server-side.**

## 2. Cleanup in `finally` — the buffer-wipe invariant

The image buffer wipe is both a **privacy invariant** and a **reliability rule**: it runs on success, on validation failure, on AI failure, on timeout — every path.

```ts
// the use case owns the guarantee
async execute(input: AnalyzeGameInput): Promise<FinalGameResult> {
  try {
    const traits = await this.traitExtraction.extract(input.file);
    // …candidates → judge → aggregate (text-only from here on)
  } finally {
    wipeBuffer(input.file.buffer); // zero-fill, always — lib/ helper
  }
}
```

Any resource with a lifecycle (timers, sockets, object URLs on the frontend) is released in `finally` or `onModuleDestroy` — never left to the GC's mood.

## 3. Fail-safe fire-and-forget

Side effects that the user isn't waiting on (metric/log hooks, cleanup signals) catch their **own** errors and log them — a side-effect failure never blocks or fails the pipeline.

```ts
// Do — best-effort, isolated failure
try {
  await this.telemetry.recordStageDuration(stage, durationMs);
} catch (error: unknown) {
  this.logger.warn('telemetry write failed', { stage, error: toErrorMessage(error) });
}
```

No floating promises (`no-floating-promises` is `error`): detach deliberately with an owned catch, or await.

## 4. Terminal states — no endless loading

Every async workflow reaches **success, failure, or timeout** — and the client can observe which. A swallowed error with no terminal outcome leaves the user spinning forever ([27-async-events-and-jobs.md](./27-async-events-and-jobs.md)). The frontend mirrors this: every request path renders success, error, or timeout UI — never an indefinite spinner.

## 5. Fail closed on security, degrade gracefully elsewhere

- **Security checks fail closed:** ClamAV enabled but unreachable in production ⇒ reject the upload ([15-file-upload-security.md](./15-file-upload-security.md)). Never "scan later", never skip.
- **Optional dependencies degrade:** a telemetry/log-sink outage logs a warning and continues — never a 500.
- **Required dependencies down** (Gemini unreachable) ⇒ typed `IntegrationError` → 502 with a friendly `messageKey`; never a raw provider error.

## 6. Health & graceful shutdown

- `GET /health` (the health module) does no dependency I/O — it answers while the process can serve requests; orchestrators use it for liveness.
- `app.enableShutdownHooks()` is on. Shutdown: stop accepting work → drain in-flight requests → release long-lived resources in `onModuleDestroy`, swallowing-and-logging individual stop failures so one stuck client can't block the rest.
- **Never crash the server on a stray error.** `uncaughtException`/`unhandledRejection` handlers log but do not exit — one bad request must not kill every other in-flight request.

## 7. Startup checks

Configuration is zod-validated once at startup and fails fast ([25-configuration-and-environment.md](./25-configuration-and-environment.md)) — a misconfigured deploy refuses to boot rather than failing mid-request. Production-only hardening (ClamAV fail-closed) gates on the validated environment value, not ad-hoc env reads.

---

## Checklist

- [ ] Every remote call has an adapter-owned `AbortController`/socket timeout from typed config
- [ ] Buffer wipe (and every resource release) in `finally` — verified on failure paths in tests
- [ ] Fire-and-forget side effects own their `try/catch` + logger; no floating promises
- [ ] Every workflow reaches a terminal state; frontend renders success/error/timeout — no endless loading
- [ ] Security checks fail closed in production; optional deps degrade; required-dep failure → typed 502
- [ ] Shutdown hooks on; resources released in `onModuleDestroy`; process never exits on a stray error
- [ ] Config validated fail-fast at boot
- [ ] Gates green: `npm run lint` · `typecheck` · `test:unit` · `test:coverage` · `build`
