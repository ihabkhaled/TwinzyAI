# Skill: Create a Backend Module

> Applies rules/01, 16. One feature = one module folder with the canonical anatomy; other
> modules see only its `index.ts`.

1. Scaffold only the folders the feature actually needs from the canonical tree:

   ```text
   apps/api/src/modules/NAME/
     NAME.module.ts        # NestJS wiring only — providers, imports, exports
     index.ts              # the ONLY surface other modules may import from
     api/                  # NAME.controller.ts + dto/ (Zod schemas)
     application/          # *.use-case.ts (orchestration) + *.service.ts (capabilities)
     domain/               # policies, invariants, pure decision logic
     infrastructure/       # *.repository.ts (persistence — none exists today)
     adapters/             # wrapped vendors/SDKs behind port interfaces
     model/                # types, interfaces, constants (as const + *_VALUES), schemas
     lib/                  # pure helpers and mappers
     tests/                # *.test.ts unit tests
   ```

2. `index.ts` exports the public surface only: the module class plus the tokens/types other
   modules legitimately inject. Deep cross-module imports fail
   `architecture/no-restricted-layer-imports`.
3. Register providers in `NAME.module.ts`; export only what another module injects.
4. Add the module to the `AppModule` imports in `apps/api/src/app.module.ts`.
5. Follow Controller -> Use case/Service -> (Repository) from day one, even for trivial
   modules — `modules/health` is the smallest reference.
6. Write tests alongside the code (write-unit-tests.md); new routes also get an integration
   test (write-integration-tests.md).

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
