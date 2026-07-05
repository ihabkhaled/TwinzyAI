import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';

import typescriptConfig from '../../typescript.config.mjs';
import controllerNoLogic from '../rules/controller-no-logic.mjs';
import noDirectEnvAccess from '../rules/no-direct-env-access.mjs';
import noDirectSdkImports from '../rules/no-direct-sdk-imports.mjs';
import noInlineDomainDefinitions from '../rules/no-inline-domain-definitions.mjs';
import tsxPureComposition from '../rules/tsx-pure-composition.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2023,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const CONTROLLER_FILE = '/repo/apps/api/src/modules/game/controllers/game.controller.ts';
const SERVICE_FILE = '/repo/apps/api/src/modules/game/services/game.service.ts';
const ADAPTER_FILE = '/repo/apps/api/src/modules/ai/adapters/gemini.adapter.ts';
const CONFIG_FILE = '/repo/apps/api/src/config/app-config.service.ts';
const COMPONENT_FILE = '/repo/apps/web/src/features/game/ui/UploadCard.tsx';

// TEST_CASES #31 — controller with logic fails lint
tester.run('controller-no-logic', controllerNoLogic, {
  valid: [
    {
      filename: CONTROLLER_FILE,
      code: 'class GameController { analyze(file, body) { return this.gameManager.analyze(file, body); } }',
    },
  ],
  invalid: [
    {
      filename: CONTROLLER_FILE,
      code: 'class GameController { analyze(file) { if (!file) { return null; } return this.gameManager.analyze(file); } }',
      errors: 2,
    },
  ],
});

// TEST_CASES #32 — Gemini SDK import outside adapters fails lint
tester.run('no-direct-sdk-imports', noDirectSdkImports, {
  valid: [
    {
      filename: ADAPTER_FILE,
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
tester.run('no-direct-env-access', noDirectEnvAccess, {
  valid: [
    {
      filename: CONFIG_FILE,
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

// TEST_CASES #35 — inline DTO/interface in a controller/service fails lint
tester.run('no-inline-domain-definitions', noInlineDomainDefinitions, {
  valid: [
    {
      filename: COMPONENT_FILE,
      code: 'interface UploadCardProps { onPick: () => void }',
    },
  ],
  invalid: [
    {
      filename: CONTROLLER_FILE,
      code: 'interface AnalyzeRequestDto { consent: boolean }',
      errors: 1,
    },
    {
      filename: SERVICE_FILE,
      code: 'type TraitMap = Record<string, string>;',
      errors: 1,
    },
  ],
});

// TSX purity — built-in hooks banned in component files
tester.run('tsx-pure-composition', tsxPureComposition, {
  valid: [
    {
      filename: COMPONENT_FILE,
      code: 'export const Card = (props) => { const controller = useGameController(); return null; };',
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

// TEST_CASES #34 — `any` is banned via typescript-eslint strict config
describe('typescript config bans any', () => {
  it('sets @typescript-eslint/no-explicit-any to error', () => {
    const flatEntries = typescriptConfig.filter((entry) => entry.rules !== undefined);
    const severity = flatEntries
      .map((entry) => entry.rules['@typescript-eslint/no-explicit-any'])
      .findLast((value) => value !== undefined);

    expect(severity).toBe('error');
  });
});
