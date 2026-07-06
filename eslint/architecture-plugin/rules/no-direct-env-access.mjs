import { normalizePath } from "../shared/path-utils.mjs";
import { isProcessEnvAccess } from "../shared/source-utils.mjs";

/**
 * process.env may only be read inside the config/bootstrap layer:
 * - apps/api/src/config/** (AppConfigService and its env loader/schema)
 * - apps/api/src/bootstrap/** (process wiring before DI is available)
 * - apps/web/src/lib/config/** (public env wrapper)
 * - build/test tooling files (next.config, vitest/playwright configs, scripts)
 */
const ALLOWED_PATH_PATTERNS = [
  "/apps/api/src/config/",
  "/apps/api/src/bootstrap/",
  "/apps/web/src/lib/config/",
  "/scripts/",
  "/e2e/",
];

const ALLOWED_FILE_SUFFIXES = [
  "next.config.ts",
  "vitest.config.ts",
  "playwright.config.ts",
  ".config.mjs",
];

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid process.env access outside the config module.",
    },
    schema: [],
    messages: {
      noEnv:
        "Do not read process.env here. Use the config service/wrapper instead.",
    },
  },
  create(context) {
    const filename = normalizePath(context.filename);

    const isAllowed =
      ALLOWED_PATH_PATTERNS.some((pattern) => filename.includes(pattern)) ||
      ALLOWED_FILE_SUFFIXES.some((suffix) => filename.endsWith(suffix));

    if (isAllowed) {
      return {};
    }

    return {
      MemberExpression(node) {
        if (isProcessEnvAccess(node)) {
          context.report({ node, messageId: "noEnv" });
        }
      },
    };
  },
};
