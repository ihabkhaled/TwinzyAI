import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { vendorBoundaryRuleOptions } from "../../package-boundaries.config.mjs";
import applicationLayerBoundaries from "../rules/application-layer-boundaries.mjs";
import controllerNoLogic from "../rules/controller-no-logic.mjs";
import noDirectEnvAccess from "../rules/no-direct-env-access.mjs";
import noDirectSdkImports from "../rules/no-direct-sdk-imports.mjs";
import noInlineDomainDefinitions from "../rules/no-inline-domain-definitions.mjs";
import noReactInPureLayers from "../rules/no-react-in-pure-layers.mjs";
import noRestrictedLayerImports from "../rules/no-restricted-layer-imports.mjs";
import noRestrictedVendorImports from "../rules/no-restricted-vendor-imports.mjs";
import repositoryPersistenceOnly from "../rules/repository-persistence-only.mjs";
import tsxPureComposition from "../rules/tsx-pure-composition.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2023,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

// Legacy layout (pre-migration) fixtures.
const CONTROLLER_FILE =
  "/repo/apps/api/src/modules/game/controllers/game.controller.ts";
const SERVICE_FILE = "/repo/apps/api/src/modules/game/services/game.service.ts";
const ADAPTER_FILE = "/repo/apps/api/src/modules/ai/adapters/gemini.adapter.ts";
const CONFIG_FILE = "/repo/apps/api/src/config/app-config.service.ts";
const COMPONENT_FILE = "/repo/apps/web/src/features/game/ui/UploadCard.tsx";

// Canonical anatomy (post-migration) fixtures.
const API_CONTROLLER_FILE =
  "/repo/apps/api/src/modules/game/api/game.controller.ts";
const USE_CASE_FILE =
  "/repo/apps/api/src/modules/game/application/analyze-image.use-case.ts";
const APPLICATION_SERVICE_FILE =
  "/repo/apps/api/src/modules/game/application/game.service.ts";
const TRAIT_EXTRACTION_SERVICE_FILE =
  "/repo/apps/api/src/modules/ai/application/trait-extraction.service.ts";
const CANDIDATE_GENERATION_SERVICE_FILE =
  "/repo/apps/api/src/modules/ai/application/candidate-generation.service.ts";
const INFRA_REPOSITORY_FILE =
  "/repo/apps/api/src/modules/game/infrastructure/game-session.repository.ts";
const CORE_LOGGER_FILE = "/repo/apps/api/src/core/logger/app-logger.service.ts";
const BOOTSTRAP_FILE = "/repo/apps/api/src/bootstrap/create-app.ts";
const MODULE_LIB_FILE =
  "/repo/apps/api/src/modules/game/lib/trait-formatting.ts";
const WEB_SERVICE_FILE =
  "/repo/apps/web/src/features/game/services/game.service.ts";

// TEST_CASES #31 — controllers must be single-return delegations.
// Suffix-targeted: any apps/api file ending in .controller.ts, any folder.
tester.run("controller-no-logic", controllerNoLogic, {
  valid: [
    {
      filename: CONTROLLER_FILE,
      code: "class GameController { analyze(file, body) { return this.gameManager.analyze(file, body); } }",
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { async analyze(body) { return await this.analyzeImageUseCase.execute(body); } }",
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { constructor(private readonly useCase) {} health() { return this.useCase.health(); } }",
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { find(id) { return this.useCase?.execute(id); } }",
    },
    {
      // Not a *.controller.ts file — untargeted even inside a controllers/ folder.
      filename: "/repo/apps/api/src/modules/game/controllers/helpers.ts",
      code: "class Helper { compute(a) { const b = a + 1; return b; } }",
    },
    {
      // Web files are never targeted.
      filename:
        "/repo/apps/web/src/features/game/services/upload.controller.ts",
      code: "class UploadController { run(a) { const b = a + 1; return b; } }",
    },
  ],
  invalid: [
    {
      filename: CONTROLLER_FILE,
      code: "class GameController { analyze(file) { if (!file) { return null; } return this.gameManager.analyze(file); } }",
      errors: [{ messageId: "singleReturnOnly" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { analyze(body) { const dto = this.map(body); return this.useCase.execute(dto); } }",
      errors: [{ messageId: "singleReturnOnly" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { analyze(body) { return { ok: this.useCase.execute(body) }; } }",
      errors: [{ messageId: "invalidReturn" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { analyze(body) { return this.a.run(body) ?? this.b.run(body); } }",
      errors: [{ messageId: "invalidReturn" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { health() { return this.status; } }",
      errors: [{ messageId: "invalidReturn" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { analyze(body) { return this.useCase.execute(this.map(body)); } }",
      errors: [{ messageId: "invalidReturn" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "class GameController { constructor(useCase) { this.log(); } }",
      errors: [{ messageId: "constructorWiringOnly" }],
    },
  ],
});

// Application layer (use cases + services) never reaches back into api/
// and never touches provider SDKs. Downward imports are allowed.
tester.run("application-layer-boundaries", applicationLayerBoundaries, {
  valid: [
    {
      filename: USE_CASE_FILE,
      code: "import { GameSessionRepository } from '../infrastructure/game-session.repository';",
    },
    {
      filename: APPLICATION_SERVICE_FILE,
      code: "import { GeminiAdapter } from '../adapters/gemini.adapter';",
    },
    {
      filename: APPLICATION_SERVICE_FILE,
      code: "import { GameSession } from '../domain/game-session';",
    },
    {
      filename: USE_CASE_FILE,
      code: "import { TraitMap } from '../model/trait-map';",
    },
    {
      filename: TRAIT_EXTRACTION_SERVICE_FILE,
      code: "class TraitExtractionService { run() { return this.provider.generateFromImageStream('prompt', this.image); } }",
    },
    {
      filename: CANDIDATE_GENERATION_SERVICE_FILE,
      code: "class CandidateGenerationService { run() { return this.provider.generateFromTextStream('prompt'); } }",
    },
    {
      filename: "/repo/apps/api/src/modules/ai/adapters/ai-router.service.ts",
      code: "class AiRouterService { run() { return this.adapter.generateFromImageStream('prompt', this.image); } }",
    },
    {
      filename: APPLICATION_SERVICE_FILE,
      code: "import { formatTraits } from '../lib/trait-formatting';",
    },
    {
      // Web services are out of scope.
      filename: WEB_SERVICE_FILE,
      code: "import { GoogleGenAI } from '@google/genai';",
    },
    {
      // Non-application api files are out of scope for this rule.
      filename: MODULE_LIB_FILE,
      code: "import { AnalyzeRequestDto } from '../api/dto/analyze-request.dto';",
    },
  ],
  invalid: [
    {
      filename: USE_CASE_FILE,
      code: "import { AnalyzeRequestDto } from '../api/dto/analyze-request.dto';",
      errors: [{ messageId: "noApiImport" }],
    },
    {
      filename: APPLICATION_SERVICE_FILE,
      code: "import { GameController } from '../api/game.controller';",
      errors: [{ messageId: "noApiImport" }],
    },
    {
      filename: APPLICATION_SERVICE_FILE,
      code: "import { GoogleGenAI } from '@google/genai';",
      errors: [{ messageId: "noSdk" }],
    },
    {
      // Legacy services/ folder files end in .service.ts, so still covered.
      filename: SERVICE_FILE,
      code: "import OpenAI from 'openai';",
      errors: [{ messageId: "noSdk" }],
    },
    {
      filename: CANDIDATE_GENERATION_SERVICE_FILE,
      code: "class CandidateGenerationService { run() { return this.provider.generateFromImageStream('prompt', this.image); } }",
      errors: [{ messageId: "imageOutsideExtraction" }],
    },
    {
      filename:
        "/repo/apps/api/src/modules/ai/application/candidate-judge.service.ts",
      code: "class CandidateJudgeService { run() { return this.provider.generateFromImage('prompt', this.image); } }",
      errors: [{ messageId: "imageOutsideExtraction" }],
    },
    {
      filename: CANDIDATE_GENERATION_SERVICE_FILE,
      code: "class CandidateGenerationService { run() { return this.provider['generateFromImageStream']('prompt', this.image); } }",
      errors: [{ messageId: "imageOutsideExtraction" }],
    },
  ],
});

// Repositories: infrastructure/ folder or *.repository.ts suffix.
tester.run("repository-persistence-only", repositoryPersistenceOnly, {
  valid: [
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "import { GameSession } from '../domain/game-session';",
    },
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "import { Injectable } from '@nestjs/common';",
    },
    {
      // The apps/api workspace segment must never read as an api/ layer import.
      filename: INFRA_REPOSITORY_FILE,
      code: "import { TraitMap } from '../model/trait-map';",
    },
    {
      // Suffix match outside infrastructure/ still counts as a repository.
      filename:
        "/repo/apps/api/src/modules/game/repositories/game.repository.ts",
      code: "import { GameSession } from '../models/game-session';",
    },
  ],
  invalid: [
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "import { AnalyzeRequestDto } from '../api/dto/analyze-request.dto';",
      errors: [{ messageId: "noUpwardImport" }],
    },
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "import { AnalyzeImageUseCase } from '../application/analyze-image.use-case';",
      errors: [{ messageId: "noUpwardImport" }],
    },
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "import { GeminiAdapter } from '../adapters/gemini.adapter';",
      errors: [{ messageId: "noUpwardImport" }],
    },
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "import { GoogleGenAI } from '@google/genai';",
      errors: [{ messageId: "noSdk" }],
    },
  ],
});

// TEST_CASES #32 — Gemini SDK import outside adapters fails lint
tester.run("no-direct-sdk-imports", noDirectSdkImports, {
  valid: [
    {
      filename: ADAPTER_FILE,
      code: "import { GoogleGenAI } from '@google/genai';",
    },
    {
      // *.adapter.ts suffix is an adapter home wherever it lives.
      filename: "/repo/apps/api/src/modules/ai/gemini.adapter.ts",
      code: "import { GoogleGenAI } from '@google/genai';",
    },
  ],
  invalid: [
    {
      filename: SERVICE_FILE,
      code: "import { GoogleGenAI } from '@google/genai';",
      errors: 1,
    },
  ],
});

// TEST_CASES #33 — process.env outside config fails lint
tester.run("no-direct-env-access", noDirectEnvAccess, {
  valid: [
    {
      filename: CONFIG_FILE,
      code: "const port = process.env['API_PORT'];",
    },
    {
      // Bootstrap wires the process before DI exists.
      filename: BOOTSTRAP_FILE,
      code: "const port = process.env['API_PORT'];",
    },
  ],
  invalid: [
    {
      filename: SERVICE_FILE,
      code: "const key = process.env['GEMINI_API_KEY'];",
      errors: 1,
    },
  ],
});

// TEST_CASES #35 — inline DTO/interface in a layer file fails lint
tester.run("no-inline-domain-definitions", noInlineDomainDefinitions, {
  valid: [
    {
      filename: COMPONENT_FILE,
      code: "interface UploadCardProps { onPick: () => void }",
    },
    {
      // domain/ is a definition home in the canonical anatomy.
      filename: "/repo/apps/api/src/modules/game/domain/game-session.ts",
      code: "export interface GameSession { id: string }",
    },
    {
      // api/dto is the DTO home — declarations belong there.
      filename:
        "/repo/apps/api/src/modules/game/api/dto/analyze-request.dto.ts",
      code: "export interface AnalyzeRequestDto { consent: boolean }",
    },
    {
      // model/ is a definition home — value constants belong there.
      filename: "/repo/apps/api/src/modules/game/model/game.constants.ts",
      code: "export const MAX_TRAITS = 15;",
    },
    {
      // Function-valued consts are collaborators, not definitions.
      filename: SERVICE_FILE,
      code: "const buildKey = (id) => `game:${id}`;",
    },
    {
      // The approved logging-context constant is the single allowed value const.
      filename: SERVICE_FILE,
      code: "const LOG_CONTEXT = 'GameService';",
    },
  ],
  invalid: [
    {
      filename: CONTROLLER_FILE,
      code: "interface AnalyzeRequestDto { consent: boolean }",
      errors: 1,
    },
    {
      filename: SERVICE_FILE,
      code: "type TraitMap = Record<string, string>;",
      errors: 1,
    },
    {
      // A module-level value/config const in a layer file must move to constants/.
      filename: SERVICE_FILE,
      code: "const RETRY_LIMIT = 3;",
      errors: [{ messageId: "inlineConst" }],
    },
    {
      // `as const` config maps are exactly what must live in constants/.
      filename: SERVICE_FILE,
      code: "const STATUS = { ok: 'ok' } as const;",
      errors: [{ messageId: "inlineConst" }],
    },
    {
      filename: SERVICE_FILE,
      code: "const schema = z.object({ id: z.string() });",
      errors: [{ messageId: "inlineConst" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "interface AnalyzeRequestDto { consent: boolean }",
      errors: 1,
    },
    {
      filename: USE_CASE_FILE,
      code: "type TraitMap = Record<string, string>;",
      errors: 1,
    },
    {
      filename: INFRA_REPOSITORY_FILE,
      code: "interface Row { id: string }",
      errors: 1,
    },
  ],
});

// Layer-direction map: canonical anatomy additions.
tester.run("no-restricted-layer-imports", noRestrictedLayerImports, {
  valid: [
    {
      // api/ may import the application layer.
      filename: API_CONTROLLER_FILE,
      code: "import { AnalyzeImageUseCase } from '../application/analyze-image.use-case';",
    },
    {
      // Files without a layer folder (e.g. core/) are untargeted.
      filename: CORE_LOGGER_FILE,
      code: "import pino from 'pino';",
    },
  ],
  invalid: [
    {
      filename: API_CONTROLLER_FILE,
      code: "import { GameSessionRepository } from '../infrastructure/game-session.repository';",
      errors: [{ messageId: "forbidden" }],
    },
    {
      filename: API_CONTROLLER_FILE,
      code: "import { GeminiAdapter } from '../adapters/gemini.adapter';",
      errors: [{ messageId: "forbidden" }],
    },
    {
      filename:
        "/repo/apps/api/src/modules/game/api/dto/analyze-request.dto.ts",
      code: "import { AnalyzeImageUseCase } from '../../application/analyze-image.use-case';",
      errors: [{ messageId: "forbidden" }],
    },
  ],
});

// TSX purity — built-in hooks banned in component files
tester.run("tsx-pure-composition", tsxPureComposition, {
  valid: [
    {
      filename: COMPONENT_FILE,
      code: "export const Card = (props) => { const controller = useGameController(); return null; };",
    },
  ],
  invalid: [
    {
      filename: COMPONENT_FILE,
      code: "import { useState } from 'react'; export const Card = () => { const [a, setA] = useState(0); return null; };",
      errors: 1,
    },
  ],
});

// Pure logic layers stay framework-agnostic: no runtime React outside
// components (.tsx) and hooks (*.hook.ts); type-only React imports are allowed.
tester.run("no-react-in-pure-layers", noReactInPureLayers, {
  valid: [
    {
      // Type-only React import in a model/types file is allowed (erased at compile time).
      filename: "/repo/apps/web/src/modules/game/model/game-component.types.ts",
      code: "import type { ReactNode, RefObject } from 'react';",
    },
    {
      // Fully-inline type specifiers are also type-only.
      filename: "/repo/apps/web/src/shared/types/shared-view.types.ts",
      code: "import { type ReactNode } from 'react';",
    },
    {
      // Hooks legitimately consume the React runtime.
      filename: "/repo/apps/web/src/modules/game/hooks/useGame.hook.ts",
      code: "import { useState } from 'react';",
    },
    {
      // Components (.tsx) are governed by tsx-pure-composition, not this rule.
      filename: COMPONENT_FILE,
      code: "import { useMemo } from 'react';",
    },
    {
      // Non-React imports in pure files are untouched.
      filename:
        "/repo/apps/web/src/modules/game/helpers/game-display.helper.ts",
      code: "import { formatScore } from './score';",
    },
    {
      // Backend pure file importing a normal dependency is fine.
      filename: SERVICE_FILE,
      code: "import { z } from 'zod';",
    },
  ],
  invalid: [
    {
      // Default React import (runtime) in a frontend helper.
      filename:
        "/repo/apps/web/src/modules/game/helpers/game-display.helper.ts",
      code: "import React from 'react';",
      errors: 1,
    },
    {
      // Named runtime binding in a pure service file.
      filename: "/repo/apps/web/src/modules/game/services/game.service.ts",
      code: "import { createElement } from 'react';",
      errors: 1,
    },
    {
      // Mixed import with a runtime binding still fails.
      filename: "/repo/apps/web/src/modules/game/model/game.mapper.ts",
      code: "import { type ReactNode, useRef } from 'react';",
      errors: 1,
    },
    {
      // Side-effect React import in a pure file.
      filename: "/repo/apps/web/src/shared/lib/setup.ts",
      code: "import 'react-dom';",
      errors: 1,
    },
    {
      // React must never leak into the backend.
      filename: SERVICE_FILE,
      code: "import { useState } from 'react';",
      errors: 1,
    },
  ],
});

// Config-driven vendor boundaries (fed from package-boundaries.config.mjs).
tester.run("no-restricted-vendor-imports", noRestrictedVendorImports, {
  valid: [
    {
      // allowIn pass: the owning module may import its vendor.
      filename: CORE_LOGGER_FILE,
      code: "import pino from 'pino';",
      options: [vendorBoundaryRuleOptions],
    },
    {
      filename: BOOTSTRAP_FILE,
      code: "import helmet from 'helmet';",
      options: [vendorBoundaryRuleOptions],
    },
    {
      filename: "/repo/apps/api/src/modules/ai/adapters/gemini.adapter.ts",
      code: "import { GoogleGenAI } from '@google/genai';",
      options: [vendorBoundaryRuleOptions],
    },
    {
      // Unlisted vendors pass anywhere in scope.
      filename: APPLICATION_SERVICE_FILE,
      code: "import { z } from 'zod';",
      options: [vendorBoundaryRuleOptions],
    },
    {
      // restrictedAccess allowIn: config may read process.env.
      filename: CONFIG_FILE,
      code: "const port = process.env['API_PORT'];",
      options: [vendorBoundaryRuleOptions],
    },
    {
      // restrictedAccess allowIn: tooling config files may read process.env.
      filename: "/repo/vitest.config.ts",
      code: "const ci = process.env.CI;",
      options: [vendorBoundaryRuleOptions],
    },
    {
      // `from` scoping: a policy with `from` only fires on matching files.
      filename: CORE_LOGGER_FILE,
      code: "import { render } from 'ink';",
      options: [
        {
          policies: [
            {
              from: ["/apps/web/"],
              forbid: ["^ink$"],
              message: "Web-only policy.",
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    {
      // Policy match: vendor imported outside its owning module.
      filename: APPLICATION_SERVICE_FILE,
      code: "import pino from 'pino';",
      options: [vendorBoundaryRuleOptions],
      errors: [{ messageId: "forbiddenImport" }],
    },
    {
      // Forbidden everywhere in scope: decorator validation vendors.
      filename:
        "/repo/apps/api/src/modules/game/api/dto/analyze-request.dto.ts",
      code: "import { IsBoolean } from 'class-validator';",
      options: [vendorBoundaryRuleOptions],
      errors: [{ messageId: "forbiddenImport" }],
    },
    {
      // Throttler stays inside core/rate-limit — controllers use re-exports.
      filename: API_CONTROLLER_FILE,
      code: "import { Throttle } from '@nestjs/throttler';",
      options: [vendorBoundaryRuleOptions],
      errors: [{ messageId: "forbiddenImport" }],
    },
    {
      // Raw HTTP clients have no owning adapter yet.
      filename: MODULE_LIB_FILE,
      code: "import axios from 'axios';",
      options: [vendorBoundaryRuleOptions],
      errors: [{ messageId: "forbiddenImport" }],
    },
    {
      // Fastify never leaks outside bootstrap — not even in tests.
      filename: "/repo/apps/api/src/tests/app.integration.test.ts",
      code: "import fastify from 'fastify';",
      options: [vendorBoundaryRuleOptions],
      errors: [{ messageId: "forbiddenImport" }],
    },
    {
      // restrictedAccess: process.env outside the allowed homes.
      filename: APPLICATION_SERVICE_FILE,
      code: "const key = process.env['GEMINI_API_KEY'];",
      options: [vendorBoundaryRuleOptions],
      errors: [{ messageId: "restrictedAccess" }],
    },
    {
      // `from` scoping: fires when the file matches.
      filename: "/repo/apps/web/src/features/game/services/game.service.ts",
      code: "import { render } from 'ink';",
      options: [
        {
          policies: [
            {
              from: ["/apps/web/"],
              forbid: ["^ink$"],
              message: "Web-only policy.",
            },
          ],
        },
      ],
      errors: [{ messageId: "forbiddenImport" }],
    },
  ],
});
