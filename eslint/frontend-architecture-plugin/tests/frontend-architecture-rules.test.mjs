import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import noCrossModuleDeepImports from "../rules/no-cross-module-deep-imports.mjs";
import noDirectBrowserApiOutsidePackages from "../rules/no-direct-browser-api-outside-packages.mjs";
import noHooksInComponents from "../rules/no-hooks-in-components.mjs";
import noInlineClassnameOutsideDesignSystem from "../rules/no-inline-classname-outside-design-system.mjs";
import noInlineComponentLogic from "../rules/no-inline-component-logic.mjs";
import noInlineDeclarations from "../rules/no-inline-declarations.mjs";
import noInlineQueryKeys from "../rules/no-inline-query-keys.mjs";
import noProcessEnvOutsideConfig from "../rules/no-process-env-outside-config.mjs";
import noRawI18nText from "../rules/no-raw-i18n-text.mjs";
import noRawPackageImports from "../rules/no-raw-package-imports.mjs";
import noRestrictedLayerImports from "../rules/no-restricted-layer-imports.mjs";
import noServerOnlyImportInClient from "../rules/no-server-only-import-in-client.mjs";
import requireClientComponentReason from "../rules/require-client-component-reason.mjs";

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

const COMPONENT_FILE =
  "/repo/apps/web/src/modules/game/components/card.component.tsx";
const CONTAINER_FILE =
  "/repo/apps/web/src/modules/game/containers/game.container.tsx";
const HOOK_FILE = "/repo/apps/web/src/modules/game/hooks/use-game.hook.ts";
const SERVICE_FILE = "/repo/apps/web/src/modules/game/services/game.service.ts";
const QUERY_FILE = "/repo/apps/web/src/modules/game/queries/game.queries.ts";
const QUERY_KEYS_FILE =
  "/repo/apps/web/src/modules/game/queries/game-query-keys.ts";
const PACKAGE_FILE = "/repo/apps/web/src/packages/axios/http-client.ts";
const SHARED_FILE = "/repo/apps/web/src/shared/utils/format.ts";
const APP_ROUTE_FILE = "/repo/apps/web/src/app/game/page.tsx";
const DESIGN_SYSTEM_FILE =
  "/repo/apps/web/src/shared/components/primitives/button.tsx";
const STYLES_FILE = "/repo/apps/web/src/modules/game/components/card.styles.ts";
const ENV_FILE = "/repo/apps/web/src/packages/env/public-env.ts";

const packageBoundaries = {
  boundaries: [
    { package: "axios", owners: ["src/packages/axios/"], allowInTests: true },
    { package: "zustand", owners: ["src/packages/zustand/"] },
    { package: "zod", owners: ["src/packages/zod/"] },
    { package: "lucide-react", owners: ["src/packages/icons/"] },
  ],
};

const layerPolicies = {
  policies: [
    {
      from: "module-components",
      forbid: ["module-hooks", "module-services", "module-gateway", "app"],
      message:
        "Components receive computed props; behavior lives in containers/hooks.",
    },
    {
      from: "module-hooks",
      forbid: ["module-components", "module-containers", "app"],
      message:
        "Hooks orchestrate data and state; they never reach into the view layer.",
    },
    {
      from: "module-services",
      forbid: ["module-components", "module-hooks", "module-queries", "app"],
      message:
        "Services are pure API/use-case functions; React does not exist here.",
    },
    {
      from: "module-gateway",
      forbid: ["module-components", "module-hooks", "module-services", "app"],
      message: "Gateways speak HTTP contracts only.",
    },
    {
      from: "shared",
      forbid: ["module-components", "module-hooks", "module-services", "app"],
      message:
        "Shared code is generic; it must never know about feature modules or routes.",
    },
    {
      from: "packages",
      forbid: [
        "module-components",
        "module-hooks",
        "module-services",
        "shared",
        "app",
      ],
      message:
        "Package wrappers own one vendor and expose a facade; they sit below every layer.",
    },
  ],
};

// Rule 1: components must not call hooks or import from hooks/queries/store layers.
tester.run("no-hooks-in-components", noHooksInComponents, {
  valid: [
    {
      filename: CONTAINER_FILE,
      code: "import { useGame } from '../hooks/use-game.hook'; export const GameContainer = () => { const game = useGame(); return null; };",
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = (props) => { return <div>{props.title}</div>; };",
    },
    {
      filename: HOOK_FILE,
      code: "import { useState } from 'react'; export const useGame = () => { const [a, setA] = useState(0); return a; };",
    },
  ],
  invalid: [
    {
      filename: COMPONENT_FILE,
      code: "import { useState } from 'react'; export const Card = () => { const [a, setA] = useState(0); return null; };",
      errors: [{ messageId: "hookImport" }, { messageId: "hookCall" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "import { useGame } from '../hooks/use-game.hook'; export const Card = () => { const game = useGame(); return null; };",
      errors: [{ messageId: "hookImport" }, { messageId: "hookCall" }],
    },
  ],
});

// Rule 2: no inline logic, handlers, transforms, or nested ternaries in components.
tester.run("no-inline-component-logic", noInlineComponentLogic, {
  valid: [
    {
      filename: COMPONENT_FILE,
      code: "export const Card = ({ title, onClick }) => { return <button onClick={onClick}>{title}</button>; };",
    },
    {
      filename: CONTAINER_FILE,
      code: "export const GameContainer = () => { const items = [1, 2].map((n) => n * 2); return <div>{items}</div>; };",
    },
  ],
  invalid: [
    {
      filename: COMPONENT_FILE,
      code: "export const Card = ({ onClick }) => { return <button onClick={() => onClick()}>Go</button>; };",
      errors: [{ messageId: "inlineHandler" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = ({ items }) => { return <div>{items.map((i) => <span key={i}>{i}</span>)}</div>; };",
      errors: [{ messageId: "inlineTransform" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = ({ a, b }) => { return <div>{a ? (b ? 'X' : 'Y') : 'Z'}</div>; };",
      errors: [{ messageId: "nestedTernary" }, { messageId: "nestedTernary" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = ({ theme }) => { return <div className={theme === 'dark' ? 'bg-black' : 'bg-white'}>Hi</div>; };",
      errors: [{ messageId: "inlineComputation" }],
    },
  ],
});

// Rule 3: no inline types/interfaces/enums/constants in implementation files.
tester.run("no-inline-declarations", noInlineDeclarations, {
  valid: [
    {
      filename: "/repo/apps/web/src/modules/game/types/game.types.ts",
      code: "export interface GameState { score: number; }",
    },
    {
      filename: "/repo/apps/web/src/modules/game/constants/game.constants.ts",
      code: "export const MAX_SCORE = 100;",
    },
    {
      filename: HOOK_FILE,
      code: "const LOG_PREFIX = 'useGame'; export const useGame = () => { return null; };",
    },
    {
      filename: HOOK_FILE,
      code: "const buildKey = (id: string) => `game:${id}`; export const useGame = () => { return null; };",
    },
  ],
  invalid: [
    {
      filename: HOOK_FILE,
      code: "interface GameState { score: number; } export const useGame = () => { return null; };",
      errors: [{ messageId: "inlineType" }],
    },
    {
      filename: SERVICE_FILE,
      code: "type GameState = { score: number; }; export const fetchGame = () => { return null; };",
      errors: [{ messageId: "inlineType" }],
    },
    {
      filename: SERVICE_FILE,
      code: "const MAX_SCORE = 100; export const fetchGame = () => { return null; };",
      errors: [{ messageId: "inlineConst" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = () => { const label = 'Hello'; return <div>{label}</div>; };",
      errors: [{ messageId: "componentBodyDeclaration" }],
    },
  ],
});

// Rule 4: raw package imports are only allowed inside their owning package wrapper.
tester.run("no-raw-package-imports", noRawPackageImports, {
  valid: [
    {
      filename: PACKAGE_FILE,
      code: "import axios from 'axios';",
      options: [packageBoundaries],
    },
    {
      filename: "/repo/apps/web/src/modules/game/tests/game.test.ts",
      code: "import axios from 'axios';",
      options: [packageBoundaries],
    },
    {
      filename: SERVICE_FILE,
      code: "import { httpClient } from '@/packages/axios';",
      options: [packageBoundaries],
    },
  ],
  invalid: [
    {
      filename: SERVICE_FILE,
      code: "import axios from 'axios';",
      options: [packageBoundaries],
      errors: [{ messageId: "rawImport" }],
    },
    {
      filename: HOOK_FILE,
      code: "import { create } from 'zustand';",
      options: [packageBoundaries],
      errors: [{ messageId: "rawImport" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "import { z } from 'zod';",
      options: [packageBoundaries],
      errors: [{ messageId: "rawImport" }],
    },
  ],
});

// Rule 5: no deep imports into another module's internals.
tester.run("no-cross-module-deep-imports", noCrossModuleDeepImports, {
  valid: [
    {
      filename: SERVICE_FILE,
      code: "import { profileApi } from '@/modules/profile';",
    },
    {
      filename: SERVICE_FILE,
      code: "import { helper } from './helper';",
    },
  ],
  invalid: [
    {
      filename: SERVICE_FILE,
      code: "import { profileApi } from '@/modules/profile/services/profile.service';",
      errors: [{ messageId: "deepImport" }],
    },
    {
      filename: SERVICE_FILE,
      code: "import { profileApi } from '../../profile/services/profile.service';",
      errors: [{ messageId: "deepImport" }],
    },
  ],
});

// Rule 6: one-way dependencies between frontend layers.
tester.run("no-restricted-layer-imports", noRestrictedLayerImports, {
  valid: [
    {
      filename: CONTAINER_FILE,
      code: "import { useGame } from '../hooks/use-game.hook';",
      options: [layerPolicies],
    },
    {
      filename: HOOK_FILE,
      code: "import { gameService } from '../services/game.service';",
      options: [layerPolicies],
    },
    {
      filename: SERVICE_FILE,
      code: "import { gameGateway } from '../gateway/game.gateway';",
      options: [layerPolicies],
    },
  ],
  invalid: [
    {
      filename: COMPONENT_FILE,
      code: "import { useGame } from '../hooks/use-game.hook';",
      options: [layerPolicies],
      errors: [{ messageId: "restricted" }],
    },
    {
      filename: HOOK_FILE,
      code: "import { Card } from '../components/card.component';",
      options: [layerPolicies],
      errors: [{ messageId: "restricted" }],
    },
    {
      filename: SERVICE_FILE,
      code: "import { useGame } from '../hooks/use-game.hook';",
      options: [layerPolicies],
      errors: [{ messageId: "restricted" }],
    },
    {
      filename: SHARED_FILE,
      code: "import { gameService } from '@/modules/game/services/game.service';",
      options: [layerPolicies],
      errors: [{ messageId: "restricted" }],
    },
  ],
});

// Rule 7: browser globals only inside browser/storage/camera packages.
tester.run(
  "no-direct-browser-api-outside-packages",
  noDirectBrowserApiOutsidePackages,
  {
    valid: [
      {
        filename: "/repo/apps/web/src/packages/browser/window.ts",
        code: "export const getWidth = () => window.innerWidth;",
      },
      {
        filename: "/repo/apps/web/src/packages/storage/local-storage.ts",
        code: "export const getItem = (key: string) => localStorage.getItem(key);",
      },
      {
        filename: HOOK_FILE,
        code: "const getWidth = () => 0; export const useGame = () => { return getWidth(); };",
      },
    ],
    invalid: [
      {
        filename: HOOK_FILE,
        code: "export const useGame = () => { return window.innerWidth; };",
        errors: [{ messageId: "rawBrowserApi" }],
      },
      {
        filename: SERVICE_FILE,
        code: "export const getToken = () => localStorage.getItem('token');",
        errors: [{ messageId: "rawBrowserApi" }],
      },
    ],
  },
);

// Rule 8: process.env only inside env/config/test files.
tester.run("no-process-env-outside-config", noProcessEnvOutsideConfig, {
  valid: [
    {
      filename: ENV_FILE,
      code: "export const apiUrl = process.env['NEXT_PUBLIC_API_URL'];",
    },
    {
      filename: "/repo/apps/web/src/shared/config/app.config.ts",
      code: "export const apiUrl = process.env['NEXT_PUBLIC_API_URL'];",
    },
  ],
  invalid: [
    {
      filename: HOOK_FILE,
      code: "export const useGame = () => { return process.env['NEXT_PUBLIC_API_URL']; };",
      errors: [{ messageId: "rawEnv" }],
    },
    {
      filename: SERVICE_FILE,
      code: "export const apiUrl = process.env['NEXT_PUBLIC_API_URL'];",
      errors: [{ messageId: "rawEnv" }],
    },
  ],
});

// Rule 9: no raw user-facing text in components.
tester.run("no-raw-i18n-text", noRawI18nText, {
  valid: [
    {
      filename: COMPONENT_FILE,
      code: "export const Card = ({ title }) => { return <div>{title}</div>; };",
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = () => { return <div aria-hidden='true'>*</div>; };",
    },
  ],
  invalid: [
    {
      filename: COMPONENT_FILE,
      code: "export const Card = () => { return <div>Hello world</div>; };",
      errors: [{ messageId: "rawText" }],
    },
    {
      filename: COMPONENT_FILE,
      code: "export const Card = () => { return <button aria-label='Submit'>Go</button>; };",
      errors: [{ messageId: "rawAttribute" }, { messageId: "rawText" }],
    },
  ],
});

// Rule 10: no raw className strings outside design-system primitives and *.styles.ts/*.variants.ts.
tester.run(
  "no-inline-classname-outside-design-system",
  noInlineClassnameOutsideDesignSystem,
  {
    valid: [
      {
        filename: DESIGN_SYSTEM_FILE,
        code: "export const Button = () => { return <button className='px-4 py-2'>Click</button>; };",
      },
      {
        filename: STYLES_FILE,
        code: "export const cardClasses = 'rounded-lg shadow-md';",
      },
      {
        filename: COMPONENT_FILE,
        code: "import { cardClasses } from './card.styles'; export const Card = () => { return <div className={cardClasses}>Hi</div>; };",
      },
    ],
    invalid: [
      {
        filename: COMPONENT_FILE,
        code: "export const Card = () => { return <div className='p-4 text-lg'>Hi</div>; };",
        errors: [{ messageId: "rawClassName" }],
      },
      {
        filename: CONTAINER_FILE,
        code: "export const GameContainer = () => { return <div className={`p-4 ${'active'}`}>Hi</div>; };",
        errors: [{ messageId: "rawClassName" }],
      },
    ],
  },
);

// Rule 11: query/mutation keys must come from query-key builder files.
tester.run("no-inline-query-keys", noInlineQueryKeys, {
  valid: [
    {
      filename: QUERY_KEYS_FILE,
      code: "export const gameQueryKeys = { list: () => ['game', 'list'] };",
    },
    {
      filename: QUERY_FILE,
      code: "import { gameQueryKeys } from './game-query-keys'; export const useGame = () => { return { queryKey: gameQueryKeys.list() }; };",
    },
  ],
  invalid: [
    {
      filename: QUERY_FILE,
      code: "export const useGame = () => { return { queryKey: ['game', 'list'] }; };",
      errors: [{ messageId: "inlineKey" }],
    },
    {
      filename: HOOK_FILE,
      code: "export const useGame = () => { return { mutationKey: ['game', 'create'] }; };",
      errors: [{ messageId: "inlineKey" }],
    },
  ],
});

// Rule 12: every 'use client' boundary needs a specific reason comment.
tester.run("require-client-component-reason", requireClientComponentReason, {
  valid: [
    {
      filename: CONTAINER_FILE,
      code: "'use client';\n// client-boundary-reason: uses interactive form state through a container hook.\nexport const GameContainer = () => { return null; };",
    },
    {
      filename: APP_ROUTE_FILE,
      code: "export default function Page() { return <div>Server</div>; }",
    },
  ],
  invalid: [
    {
      filename: CONTAINER_FILE,
      code: "'use client';\nexport const GameContainer = () => { return null; };",
      errors: [{ messageId: "missingReason" }],
    },
    {
      filename: CONTAINER_FILE,
      code: "'use client';\n// client-boundary-reason: needed\nexport const GameContainer = () => { return null; };",
      errors: [{ messageId: "genericReason" }],
    },
  ],
});

// Rule 13: client files must not import server-only modules, Node built-ins, or .server. modules.
tester.run("no-server-only-import-in-client", noServerOnlyImportInClient, {
  valid: [
    {
      filename: APP_ROUTE_FILE,
      code: "import { getServerSideProps } from './server-fetch.server';\nexport default function Page() { return <div>Server</div>; }",
    },
    {
      filename: "/repo/apps/api/src/modules/game/api/game.controller.ts",
      code: "import fs from 'fs';",
    },
  ],
  invalid: [
    {
      filename: CONTAINER_FILE,
      code: "'use client';\nimport 'server-only';\nexport const GameContainer = () => { return null; };",
      errors: [{ messageId: "serverImport" }],
    },
    {
      filename: CONTAINER_FILE,
      code: "'use client';\nimport fs from 'fs';\nexport const GameContainer = () => { return null; };",
      errors: [{ messageId: "serverImport" }],
    },
    {
      filename: CONTAINER_FILE,
      code: "'use client';\nimport { serverEnv } from '@/packages/env/server-env';\nexport const GameContainer = () => { return null; };",
      errors: [{ messageId: "serverImport" }],
    },
  ],
});
