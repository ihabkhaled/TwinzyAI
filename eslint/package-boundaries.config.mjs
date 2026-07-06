/**
 * Library encapsulation boundaries (vendor → owning module).
 *
 * Every third-party library is reachable only through the ONE module that
 * owns it — never imported ad hoc. Swapping a vendor (logger, validator,
 * rate limiter, HTTP platform, ...) then touches exactly one folder.
 *
 * Consumed by architecture/no-restricted-vendor-imports, which is applied to
 * apps/api/** and packages/shared/** ONLY (never apps/web) — see
 * eslint/architecture.config.mjs. Patterns are regex strings compiled with
 * the 'u' flag: `forbid` matches the raw import source, `allowIn` matches the
 * normalized (forward-slash) filename.
 *
 * THIS FILE IS THE ADAPTATION POINT. Adding or moving a vendor means editing
 * this list — never the rule implementation under architecture-plugin/.
 */

export const vendorImportPolicies = [
  {
    // Logging vendor. Everything else logs through the core/logger wrapper.
    forbid: ["^nestjs-pino$", "^pino$", "^pino-http$", "^pino-pretty$"],
    allowIn: ["/apps/api/src/core/logger/"],
    message:
      "Import the logging vendor only inside apps/api/src/core/logger — use the AppLogger wrapper.",
  },
  {
    // No decorator-based validation anywhere in scope.
    forbid: ["^class-validator$", "^class-transformer$"],
    message:
      "class-validator/class-transformer are forbidden — zod is this repo’s only validation vendor.",
  },
  {
    // OpenAPI decorator vendor. Bootstrap owns document setup.
    forbid: ["^@nestjs/swagger$"],
    allowIn: ["/apps/api/src/core/openapi/", "/apps/api/src/bootstrap/"],
    message:
      "Import @nestjs/swagger only in apps/api/src/core/openapi (decorators) or apps/api/src/bootstrap (document setup).",
  },
  {
    // Rate-limiting vendor. core/rate-limit re-exports the decorators.
    forbid: ["^@nestjs/throttler$"],
    allowIn: ["/apps/api/src/core/rate-limit/"],
    message:
      "Import @nestjs/throttler only inside apps/api/src/core/rate-limit — controllers use its re-exports.",
  },
  {
    // Configuration vendor. Consumers inject the typed config service.
    forbid: ["^@nestjs/config$"],
    allowIn: ["/apps/api/src/config/"],
    message:
      "Import @nestjs/config only inside apps/api/src/config — inject the typed AppConfigService.",
  },
  {
    // HTTP platform vendor (Fastify, its plugins, the Nest platform binding).
    // Integration tests boot through the bootstrap helpers — no test exception.
    forbid: ["^fastify$", "^@fastify/", "^@nestjs/platform-"],
    allowIn: ["/apps/api/src/bootstrap/"],
    message:
      "The HTTP platform vendor lives only in apps/api/src/bootstrap — boot (and test) through the bootstrap helpers.",
  },
  {
    // AI provider SDK. Only the trait-extraction adapter may touch it.
    forbid: ["^@google/genai$"],
    allowIn: ["/apps/api/src/modules/ai/adapters/"],
    message:
      "Import the Gemini SDK only inside apps/api/src/modules/ai/adapters — inject the AI adapter.",
  },
  {
    // Env-file loading is a config-module concern.
    forbid: ["^dotenv$"],
    allowIn: ["/apps/api/src/config/"],
    message:
      "Import dotenv only inside apps/api/src/config — env loading belongs to the config module.",
  },
  {
    // Legacy transition vendors: quarantined in bootstrap until removed.
    forbid: ["^helmet$", "^multer$"],
    allowIn: ["/apps/api/src/bootstrap/"],
    message:
      "helmet/multer are transitional and live only in apps/api/src/bootstrap; they will be removed.",
  },
  {
    // Raw HTTP clients: forbidden everywhere until an owning adapter exists.
    forbid: ["^(axios|got|ky|node-fetch|undici|superagent)$"],
    message:
      "No owning HTTP adapter exists yet — create one under apps/api/src/core/http before importing an HTTP client.",
  },
];

/**
 * Restricted runtime access. Mirrors the no-direct-env-access allowances
 * (config/, bootstrap/, scripts/, e2e/, *.config.* tooling files) so the two
 * rules agree on where process.env may be read.
 */
export const restrictedRuntimeAccess = [
  {
    object: "process",
    property: "env",
    allowIn: [
      "/apps/api/src/config/",
      "/apps/api/src/bootstrap/",
      "/scripts/",
      "/e2e/",
      String.raw`\.config\.(?:ts|mts|cts|js|mjs|cjs)$`,
    ],
    message:
      "Read process.env only in apps/api/src/config, apps/api/src/bootstrap, scripts/, e2e/, or *.config.* files.",
  },
];

/** Options object for architecture/no-restricted-vendor-imports. */
export const vendorBoundaryRuleOptions = {
  policies: vendorImportPolicies,
  restrictedAccess: restrictedRuntimeAccess,
};
