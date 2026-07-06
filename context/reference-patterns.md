# Reference Patterns — Copy-Ready Code by Layer

> The canonical, copy-ready code for every layer and cross-cutting concern in `apps/api` (plus the shared-contract pattern both apps use). One tight, strict-TypeScript snippet per concern; each obeys the layer/import/lint rules. This implements [architecture-map.md](./architecture-map.md) and [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) — when in doubt, those win. Replace `<feature>` with your bounded feature.

Every snippet is **strict TS**: no `any`, no TypeScript `enum`, no non-null `!`, no inline domain definitions, explicit return types, zod (never class-validator). Generate new files with the [`/skills`](../skills/README.md).

---

## 1. As-const enum + `*_VALUES` + derived type

The only enum shape allowed anywhere in the repo. Lives in `packages/shared/src/enums/` when both apps need it, or a module's `model/` when local.

```ts
// packages/shared/src/enums/verdict.enum.ts
export const Verdict = {
  Strong: 'strong',
  Medium: 'medium',
  Weak: 'weak',
} as const;

export const VERDICT_VALUES = [Verdict.Strong, Verdict.Medium, Verdict.Weak] as const;

export type VerdictValue = (typeof VERDICT_VALUES)[number];
```

> `*_VALUES` feeds zod (`z.enum(VERDICT_VALUES)`) and iteration; the derived type replaces the banned `enum` keyword. See [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md).

---

## 2. Zod DTO at the HTTP boundary

The DTO is a **strict** zod schema in `api/dto/`, backed by `@twinzy/shared` building blocks. `z.strictObject` rejects unknown keys — the whitelist behavior other stacks get from `whitelist: true`.

```ts
// apps/api/src/modules/game/api/dto/analyze-request.dto.ts
import { z } from 'zod';

/**
 * Multipart body of POST /api/v1/game/analyze. Multipart fields arrive as
 * strings; consent must be the literal string "true" (or boolean true from
 * JSON clients) — anything else is not consent.
 */
export const AnalyzeRequestBodySchema = z.strictObject({
  consent: z.union([z.literal('true'), z.literal(true)]).optional(),
});

export type AnalyzeRequestBody = z.infer<typeof AnalyzeRequestBodySchema>;

export const isConsentGiven = (body: unknown): boolean => {
  const parsed = AnalyzeRequestBodySchema.safeParse(body);
  return parsed.success && parsed.data.consent !== undefined;
};
```

```ts
// Response contracts come from packages/shared — never redeclared locally.
import { FinalGameResultSchema, type FinalGameResult } from '@twinzy/shared';
```

> Request parsing runs through the zod pipe in `core/validation` (issues flattened + logged, mapped to `ValidationError`). See [/rules/21-dto-validation.md](../rules/21-dto-validation.md) and [create-dto-validation.md](../skills/create-dto-validation.md).

---

## 3. Controller — exactly one delegation

A controller method is **one** `return` of a single application-layer call. No branching, no transformation (`architecture/controller-no-logic`).

```ts
// apps/api/src/modules/game/api/game.controller.ts
import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { FinalGameResult } from '@twinzy/shared';

import { ImageUploadInterceptor } from '../../../core/http/image-upload.interceptor';
import type { UploadedImageFile } from '../../file-security/model/upload-file.types';
import { AnalyzeGameUseCase } from '../application/analyze-game.use-case';
import { ANALYZE_THROTTLE } from '../model/throttle.constants';

@Controller('game')
export class GameController {
  public constructor(private readonly analyzeGame: AnalyzeGameUseCase) {}

  @Post('analyze')
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(ImageUploadInterceptor)
  public analyze(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body() body: unknown,
  ): Promise<FinalGameResult> {
    return this.analyzeGame.execute(file, body);
  }
}
```

> Throttle values live in `model/`, upload plumbing in `core/http`. See [/rules/18-routes-controllers.md](../rules/18-routes-controllers.md) and [create-controller.md](../skills/create-controller.md).

---

## 4. Application service — focused capability (≤20 lines/method)

One job, small methods, collaborators injected, declarations extracted.

```ts
// apps/api/src/modules/result-aggregation/application/result-aggregation.service.ts
import { Injectable } from '@nestjs/common';

import type { FinalGameResult, JudgedCandidate, Traits } from '@twinzy/shared';

import { keepDisplayable, toFinalResult } from '../lib/result-aggregation.filters';
import { RESULT_DISCLAIMER } from '../model/result-aggregation.constants';

@Injectable()
export class ResultAggregationService {
  public aggregate(traits: Traits, judged: readonly JudgedCandidate[]): FinalGameResult {
    const displayable = keepDisplayable(judged);
    if (displayable.length === 0) {
      return this.buildFallback(traits);
    }
    return toFinalResult(traits, displayable, RESULT_DISCLAIMER);
  }

  public buildFallback(traits: Traits): FinalGameResult {
    return toFinalResult(traits, [], RESULT_DISCLAIMER);
  }
}
```

> Filtering/shaping lives in `lib/`, the disclaimer constant in `model/`. See [/rules/19-services-application-layer.md](../rules/19-services-application-layer.md) and [create-service-layer.md](../skills/create-service-layer.md).

---

## 5. Use case — ordered orchestration + buffer-wipe `finally`

The escalation shape: one operation sequencing several modules while owning a resource lifecycle. The image lives exactly as long as trait extraction needs it — zero-filled in `finally` on success **and** failure.

```ts
// apps/api/src/modules/game/application/analyze-game.use-case.ts
import { Injectable } from '@nestjs/common';

import type { FinalGameResult, Traits } from '@twinzy/shared';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { CandidateGenerationService } from '../../ai/application/candidate-generation.service';
import { CandidateJudgeService } from '../../ai/application/candidate-judge.service';
import { TraitExtractionService } from '../../ai/application/trait-extraction.service';
import { FileSecurityService } from '../../file-security/application/file-security.service';
import { TemporaryFileCleanupService } from '../../file-security/application/temporary-file-cleanup.service';
import type { UploadedImageFile } from '../../file-security/model/upload-file.types';
import { ResultAggregationService } from '../../result-aggregation/application/result-aggregation.service';
import { isConsentGiven } from '../api/dto/analyze-request.dto';
import { ANALYZE_LOG_CONTEXT } from '../model/game.constants';

@Injectable()
export class AnalyzeGameUseCase {
  public constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly cleanup: TemporaryFileCleanupService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly candidateGeneration: CandidateGenerationService,
    private readonly candidateJudge: CandidateJudgeService,
    private readonly resultAggregation: ResultAggregationService,
    private readonly logger: AppLogger,
  ) {}

  public async execute(file: UploadedImageFile | undefined, body: unknown): Promise<FinalGameResult> {
    const traits = await this.extractTraitsAndDestroyImage(file, isConsentGiven(body));

    const candidates = await this.candidateGeneration.generateCandidates(traits);
    if (candidates.length === 0) {
      this.logger.warn(ANALYZE_LOG_CONTEXT, 'No safe candidates — returning fallback');
      return this.resultAggregation.buildFallback(traits);
    }

    const judged = await this.candidateJudge.judgeCandidates(traits, candidates);
    return this.resultAggregation.aggregate(traits, judged);
  }

  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
  ): Promise<Traits> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      return await this.traitExtraction.extractTraits(safeFile.buffer, safeFile.mimetype);
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
```

> Use cases call services; services never call use cases. See [/rules/17-manager-layer.md](../rules/17-manager-layer.md) and [create-manager-use-case.md](../skills/create-manager-use-case.md).

---

## 6. Port + adapter — wrap every vendor behind an interface

The port (interface + `Symbol` token) lives in `model/`; the adapter is the **only** file importing the vendor SDK (`architecture/no-direct-sdk-imports`). This mirrors the AI provider port, whose two-method split is the AI-safety boundary in type form.

```ts
// apps/api/src/modules/ai/model/ai-provider.port.ts
import type { AiImageInput } from './gemini.types';

/**
 * Port for AI providers. Only generateFromImage can carry an image, and only
 * the trait-extraction service is allowed to call it. Text-only pipeline
 * steps (candidates, judge) cannot leak an image by construction.
 */
export interface AiProviderAdapter {
  generateFromImage(prompt: string, image: AiImageInput): Promise<string>;
  generateFromText(prompt: string): Promise<string>;
}

/** Injection token binding the port to the configured provider adapter. */
export const AI_PROVIDER_ADAPTER = Symbol('AI_PROVIDER_ADAPTER');
```

```ts
// Binding in the module:
// providers: [{ provide: AI_PROVIDER_ADAPTER, useClass: GeminiAdapter }]

// Consuming through the port (never the vendor):
import { Inject, Injectable } from '@nestjs/common';

import { AI_PROVIDER_ADAPTER, type AiProviderAdapter } from '../model/ai-provider.port';

@Injectable()
export class CandidateGenerationService {
  public constructor(
    @Inject(AI_PROVIDER_ADAPTER) private readonly aiProvider: AiProviderAdapter,
  ) {}
}
```

> The adapter maps every vendor failure to an `IntegrationError` (502) and enforces the configured timeout; the model name comes from `GEMINI_MODEL` env, never hardcoded. See [/rules/10-library-modularization.md](../rules/10-library-modularization.md), [/rules/14-ai-safety.md](../rules/14-ai-safety.md), and [add-ai-provider.md](../skills/add-ai-provider.md).

---

## 7. Typed config — `registerAs` namespace + zod fail-fast

`env.schema.ts` is the single source of truth for every env var. Validation runs at boot; invalid env crashes startup, not a request three hours later. `process.env` is legal only in `src/config` and `src/bootstrap`.

```ts
// apps/api/src/config/env.schema.ts (excerpt — zod, fail-fast)
import { z } from 'zod';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export const EnvSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default(''),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
});

export type ParsedEnv = z.infer<typeof EnvSchema>;

export const validateEnv = (raw: Record<string, unknown>): ParsedEnv => {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
};
```

```ts
// apps/api/src/config/gemini.config.ts (process.env permitted here)
import { registerAs } from '@nestjs/config';

import type { GeminiConfig } from './config.types';

export const geminiConfig = registerAs(
  'gemini',
  (): GeminiConfig => ({
    apiKey: process.env['GEMINI_API_KEY'] ?? '',
    model: process.env['GEMINI_MODEL'] ?? '',
    timeoutMs: Number(process.env['GEMINI_TIMEOUT_MS'] ?? 30_000),
  }),
);
```

> Wire into the root: `ConfigModule.forRoot({ isGlobal: true, load: [geminiConfig], validate: validateEnv, envFilePath: [...] })`. Business code injects the typed `AppConfigService` getter surface — never `ConfigService` raw strings, never `process.env`.

---

## 8. Errors — `AppError` subclass + `messageKey` + filter mapping

Every user-facing failure is a typed `AppError` carrying `messageKey = errors.<feature>.<key>` and a stable legacy `ErrorCode`. The global filter returns the sanitized envelope compatible with `ApiErrorResponse` (adds `messageKey` additively).

```ts
// apps/api/src/core/errors/validation.error.ts
import { HttpStatus } from '@nestjs/common';

import { AppError } from './app-error';
import { ErrorCode } from './error-code.constants';
import type { ErrorMessageKey } from './error.types';

export class ValidationError extends AppError {
  public readonly status = HttpStatus.BAD_REQUEST;
  public readonly errorCode = ErrorCode.ValidationFailed;

  public constructor(message: string, messageKey: ErrorMessageKey) {
    super(message, messageKey);
  }
}
```

```ts
// apps/api/src/core/errors/app-exception.filter.ts (shape)
import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';

import type { HttpReplyLike } from '../http/http-reply.types';
import { AppLogger } from '../logger/app-logger.service';
import { AppError } from './app-error';
import { GENERIC_ERROR_BODY } from './error-body.constants';
import { toErrorBody } from './error-body.mapper';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  public constructor(private readonly logger: AppLogger) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<HttpReplyLike>();
    if (exception instanceof AppError) {
      this.logger.warn('AppExceptionFilter', `handled: ${exception.messageKey}`);
      void reply.status(exception.status).send(toErrorBody(exception));
      return;
    }
    this.logger.error('AppExceptionFilter', 'unhandled exception', exception);
    void reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(GENERIC_ERROR_BODY);
  }
}
```

> Subclasses: `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409, `PayloadTooLargeError` 413, `IntegrationError` 502. The envelope never contains provider errors, stacks, or file contents. `HttpReplyLike` is the structural reply type in `core/http` — no raw Fastify types in business code.

---

## 9. Logging — `AppLogger` usage

nestjs-pino behind the `AppLogger` port. Context string first, message second, optional structured payload last; redaction happens inside the wrapper.

```ts
import { Injectable } from '@nestjs/common';

import { AppLogger } from '../../../core/logger/app-logger.service';

@Injectable()
export class VirusScanService {
  public constructor(private readonly logger: AppLogger) {}

  public reportOutcome(clean: boolean): void {
    if (clean) {
      this.logger.log('VirusScanService', 'scan clean');
      return;
    }
    this.logger.warn('VirusScanService', 'scan rejected upload');
  }
}
```

> Never `console.*`, never raw `pino` imports outside `core/logger`, never image bytes/prompts/PII in log payloads. See [/rules/22-observability-logging.md](../rules/22-observability-logging.md).

---

## 10. Bounded in-memory list (cap 100)

There is no database by design — any in-memory accumulation must be hard-capped so memory cannot grow unbounded.

```ts
// model/
export const MAX_TRACKED_ENTRIES = 100;

// lib/bounded-list.util.ts
export const appendBounded = <T>(
  list: readonly T[],
  entry: T,
  cap: number = MAX_TRACKED_ENTRIES,
): readonly T[] => {
  const next = [...list, entry];
  return next.length > cap ? next.slice(next.length - cap) : next;
};
```

> Every list an endpoint or service produces has a hard max; the game pipeline itself caps at 5 candidates / 4 displayed results. See [/rules/07-performance-scalability.md](../rules/07-performance-scalability.md).

---

## 11. Unit test — Vitest + `@nestjs/testing` (`*.test.ts`)

Unit tests are `*.test.ts` inside the module's `tests/` folder (vitest project `api-unit`). Mock at the boundary — ports and injected collaborators — and always assert the failure path.

```ts
// apps/api/src/modules/result-aggregation/tests/result-aggregation.service.test.ts
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ResultAggregationService } from '../application/result-aggregation.service';
import { buildJudgedCandidate, buildTraits } from '../../../tests/fixtures/stubs';

describe('ResultAggregationService', () => {
  let service: ResultAggregationService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ResultAggregationService],
    }).compile();
    service = moduleRef.get(ResultAggregationService);
  });

  it('aggregates judged candidates into a final result with the disclaimer', () => {
    const result = service.aggregate(buildTraits(), [buildJudgedCandidate({ score: 88 })]);

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });

  it('returns the fallback when nothing survives filtering', () => {
    const result = service.aggregate(buildTraits(), []);

    expect(result.results).toHaveLength(0);
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });
});
```

---

## 12. Integration test — supertest on Fastify with `.ready()`

Integration tests are `*.integration.test.ts` under `apps/api/src/tests/` (vitest project `api-integration`). Boot the real app on the Fastify adapter, swap only the outermost ports (the fake AI adapter), and **await `.ready()`** before hitting routes.

```ts
// apps/api/src/tests/health.integration.test.ts (skeleton)
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../app.module';
import { createFastifyAdapter } from '../bootstrap/fastify-adapter';
import { AI_PROVIDER_ADAPTER } from '../modules/ai/model/ai-provider.port';
import { FakeAiAdapter } from './fixtures/fake-ai-adapter';

describe('GET /api/v1/health', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER)
      .useClass(FakeAiAdapter)
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
    app.setGlobalPrefix('api');
    app.enableVersioning();
    await app.init();
    await app.getHttpAdapter().getInstance().ready(); // Fastify must be ready before requests
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds 200 with a status payload', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
  });
});
```

> Fixtures live in `apps/api/src/tests/fixtures/` (fake AI adapter, image fixtures, stubs). Real Gemini/ClamAV are never hit in tests. See [write-unit-tests.md](../skills/write-unit-tests.md) and [write-integration-tests.md](../skills/write-integration-tests.md).

---

## Cross-reference table

| Concern | Snippet | Rule | Skill |
| --- | --- | --- | --- |
| As-const enum | §1 | [05](../rules/05-types-enums-constants.md) | — |
| Zod DTO | §2 | [21](../rules/21-dto-validation.md) | [create-dto-validation](../skills/create-dto-validation.md) |
| Controller | §3 | [18](../rules/18-routes-controllers.md) | [create-controller](../skills/create-controller.md) |
| Service | §4 | [19](../rules/19-services-application-layer.md) | [create-service-layer](../skills/create-service-layer.md) |
| Use case | §5 | [17](../rules/17-manager-layer.md) | [create-manager-use-case](../skills/create-manager-use-case.md) |
| Port + adapter | §6 | [10](../rules/10-library-modularization.md), [14](../rules/14-ai-safety.md) | [add-ai-provider](../skills/add-ai-provider.md), [add-library](../skills/add-library.md) |
| Typed config | §7 | [00](../rules/00-non-negotiable-rules.md), [16](../rules/16-backend-architecture.md) | — |
| Errors + filter | §8 | [16](../rules/16-backend-architecture.md) | — |
| Logger | §9 | [22](../rules/22-observability-logging.md) | — |
| Bounded list | §10 | [07](../rules/07-performance-scalability.md) | — |
| Unit test | §11 | [09](../rules/09-testing-coverage.md) | [write-unit-tests](../skills/write-unit-tests.md) |
| Integration test | §12 | [09](../rules/09-testing-coverage.md) | [write-integration-tests](../skills/write-integration-tests.md) |

Before calling any of these done, run the quality gates:

```bash
npm run lint && npm run typecheck && npm run test:unit && npm run build
```

Related: [architecture-map.md](./architecture-map.md) · [codebase-navigation.md](./codebase-navigation.md) · [glossary.md](./glossary.md) · [stack-and-toolchain.md](./stack-and-toolchain.md) · [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md)
