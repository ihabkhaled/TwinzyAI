# 18 — Routes & Controllers

> Controllers are the **transport adapter**: they translate HTTP ⇄ application calls and contain **zero business logic**. One delegation per method, mechanically enforced by `architecture/controller-no-logic`. Implements rule 16 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

A controller does four things and nothing more: declare the route (+ OpenAPI shape when docs are enabled), attach guards/pipes/interceptors, bind validated input from decorators, and **return exactly one application call**. Everything else lives below: orchestration in [17-manager-layer.md](./17-manager-layer.md)/[19-services-application-layer.md](./19-services-application-layer.md), validation in the DTO ([21-dto-validation.md](./21-dto-validation.md)), errors in the global filter ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)).

---

## Controllers MAY

- Declare routing + metadata: `@Controller`, `@Get`/`@Post`/…, `@HttpCode`, and OpenAPI decorators (`@ApiTags`/`@ApiOperation`/`@ApiResponse` — flag-gated via `core/openapi`).
- Bind input through parameter decorators (`@Body`, `@Param`, `@Query`, `@UploadedFile`) — decorators are allowed; hand-parsing is not.
- Attach interceptors/pipes (zod validation runs via `core/validation`; the throttler applies via `core/rate-limit`).
- Delegate to **exactly one** application method (a use case or a service) and `return` its result.
- Carry `private readonly` injected use cases/services via constructor DI.

## Controllers MUST NOT

- Contain business/AI/file logic, branching on domain state, multi-step orchestration, transformation, or parsing — push it down.
- Call more than one application method per request — compose in the application layer, not here.
- Import repositories, infrastructure, or vendor SDKs (`architecture/no-restricted-layer-imports`).
- Define inline types/schemas/constants/DTOs/response shapes (`architecture/no-inline-domain-definitions`).
- Read `process.env` (rule 26) or use `console.*` (rule 27).
- Wrap bodies in `try/catch` to build error responses — throw typed `AppError`s and let the global filter format them.
- Shape responses inline — mapping belongs in `lib/` mappers; the result type comes from shared schemas.

---

## One delegation per method (`architecture/controller-no-logic`)

A controller method is exactly one `return` of a direct delegation (`await` allowed). No branching, no `await`-then-transform, no two calls.

```ts
// Don't — a decision + transformation in the controller (lint error)
@Post('analyze')
async analyze(@UploadedFile() file: UploadedImage, @Body() body: AnalyzeGameDto) {
  if (!body.consent) throw new BadRequestException();       // branching — DTO/use case's job
  const result = await this.analyzeGame.execute({ file, ...body });
  return { ...result, ts: Date.now() };                      // inline shaping
}

// Do — one delegation; validation in the DTO, orchestration in the use case
@Post('analyze')
analyze(
  @UploadedFile() file: UploadedImage,
  @Body() body: AnalyzeGameDto,
): Promise<FinalGameResult> {
  return this.analyzeGame.execute(toAnalyzeInput(file, body)); // mapper from lib/, if needed
}
```

If a handler needs a multi-step flow, it delegates to a **use case**, not a fatter controller.

---

## Validation at the boundary

All HTTP-boundary validation happens in zod DTO schemas applied through `core/validation` — **never class-validator** ([21-dto-validation.md](./21-dto-validation.md)). The controller declares the typed DTO; it never calls validators itself, and validation rules never live in the service. Params/queries are coerced explicitly in the schema, not hand-parsed with `Number(...)`.

## Errors — throw, don't catch

No `try/catch` in controllers. Lower layers throw typed `AppError`s carrying `messageKey`s; the global exception filter maps them to the sanitized envelope and logs full detail server-side. Building an error body in a controller both leaks internals and bypasses the contract.

## Status codes & responses

- Set status with `@HttpCode(HttpStatus.…)` — never touch the raw response object; reserve `@Res({ passthrough: true })` for genuine streaming and document why.
- Response types come from shared schemas (`FinalGameResult` and friends) — one contract, both sides.

---

## Anti-patterns (quick reference)

```ts
// Don't — repository/SDK in the controller (layer-import lint error)
constructor(private readonly gemini: GeminiAdapter) {}

// Don't — process.env / console in the controller (rules 26–27)
const model = process.env.GEMINI_MODEL;
console.log('analyzing');

// Don't — inline shape + magic string (rules 9–14)
const payload: { stage: string } = { stage: 'judge' };

// Do — typed DI, one delegation, typed result
analyze(@Body() dto: AnalyzeGameDto): Promise<FinalGameResult> {
  return this.analyzeGame.execute(dto);
}
```

---

## Checklist

- [ ] Each method is one delegation to a single application method (lint-verified)
- [ ] Input bound via decorators + zod DTOs; no hand-parsing, no validation in the body
- [ ] No repository/infrastructure/SDK imports; no `process.env`; no `console.*`
- [ ] No inline types/schemas/constants/response shapes
- [ ] No `try/catch` — typed `AppError`s bubble to the global filter
- [ ] Status via `@HttpCode`; response typed from shared schemas
- [ ] Integration tests cover each handler through the real pipeline ([09-testing-coverage.md](./09-testing-coverage.md))
