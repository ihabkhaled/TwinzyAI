import tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, expect, it } from "vitest";

import baseConfig from "../../base.config.mjs";
import typescriptConfig from "../../typescript.config.mjs";
import noRawLibraryImports from "../rules/no-raw-library-imports.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2023,
    sourceType: "module",
  },
});

tester.run("no-raw-library-imports", noRawLibraryImports, {
  valid: [
    {
      filename: "/repo/apps/api/src/core/logger/app-logger.service.ts",
      code: "import pino from 'pino';",
    },
    {
      filename: "/repo/apps/api/src/adapters/http/http.adapter.ts",
      code: "import axios from 'axios';",
    },
    {
      filename: "/repo/apps/web/src/packages/axios/http-client.ts",
      code: "import axios from 'axios';",
    },
  ],
  invalid: [
    {
      filename: "/repo/apps/api/src/modules/game/application/game.service.ts",
      code: "import pino from 'pino';",
      errors: [{ messageId: "noRawLibrary" }],
    },
    {
      filename: "/repo/apps/api/src/modules/game/application/game.service.ts",
      code: "import axios from 'axios';",
      errors: [{ messageId: "noRawHttp" }],
    },
  ],
});

describe("effective static configuration", () => {
  it("bans explicit any and covers mts/cts tooling files", () => {
    const flatEntries = typescriptConfig.filter(
      (entry) => entry.rules !== undefined,
    );
    const severity = flatEntries
      .map((entry) => entry.rules["@typescript-eslint/no-explicit-any"])
      .findLast((value) => value !== undefined);
    const typedFiles = typescriptConfig.flatMap((entry) => entry.files ?? []);

    expect(severity).toBe("error");
    expect(typedFiles).toContain("**/*.mts");
    expect(typedFiles).toContain("**/*.cts");
  });

  it("caps application service methods at 20 lines", () => {
    const serviceConfig = baseConfig.find((entry) =>
      entry.files?.includes("apps/api/src/modules/**/application/*.service.ts"),
    );

    expect(serviceConfig?.rules?.["max-lines-per-function"]).toEqual([
      "error",
      { max: 20, skipBlankLines: true, skipComments: true },
    ]);
  });
});
