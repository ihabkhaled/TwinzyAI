# Skill: Create a Controller (backend)

> Applies rules/16, 18, 21. Transport only — a controller is a thin HTTP adapter.

1. File: `apps/api/src/modules/NAME/api/NAME.controller.ts`. Route decorators, pipes, and
   per-route throttle overrides only.
2. Each handler is exactly ONE delegation to an application-layer class (use case or service)
   returning its typed result — enforced by `architecture/controller-no-logic`: any branch,
   loop, mapping, or try/catch in a controller fails lint.

   ```ts
   @Post()
   public analyze(@Body() dto: AnalyzeRequestDto): Promise<FinalGameResult> {
     return this.analyzeGameUseCase.execute(dto); // exactly one call, nothing else
   }
   ```

3. Input shapes are Zod DTOs in `api/dto/` (create-dto-validation.md), parsed by the global
   pipe in `apps/api/src/core/validation` — no inline schemas or types
   (`architecture/no-inline-domain-definitions`).
4. Never import repositories, adapters, SDKs, or read `process.env` — plugin-enforced by
   `architecture/no-restricted-layer-imports`, `no-direct-sdk-imports`, `no-direct-env-access`.
5. Never catch errors: typed `AppError`s bubble to the global filter in
   `apps/api/src/core/errors`, which renders the envelope (`ApiErrorResponse` fields plus
   `messageKey`).
6. Register the controller in `NAME.module.ts`; add an integration test for the route
   (write-integration-tests.md) asserting status, headers, and envelope.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
