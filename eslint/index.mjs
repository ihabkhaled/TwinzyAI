import architectureConfig from "./architecture.config.mjs";
import baseConfig from "./base.config.mjs";
import eslintCommentsConfig from "./eslint-comments.config.mjs";
import frontendAccessibilityConfig from "./frontend/accessibility.config.mjs";
import frontendArchitectureConfig from "./frontend/architecture.config.mjs";
import frontendPackageBoundariesConfig from "./frontend/package-boundaries.config.mjs";
import frontendTanstackQueryConfig from "./frontend/tanstack-query.config.mjs";
import ignoresConfig from "./ignores.config.mjs";
import importsConfig from "./imports.config.mjs";
import nextConfig from "./next.config.mjs";
import prettierConfig from "./prettier.config.mjs";
import promiseConfig from "./promise.config.mjs";
import reactConfig from "./react.config.mjs";
import reactHooksConfig from "./react-hooks.config.mjs";
import regexpConfig from "./regexp.config.mjs";
import securityConfig from "./security.config.mjs";
import sonarConfig from "./sonar.config.mjs";
import testConfig from "./test.config.mjs";
import typescriptConfig from "./typescript.config.mjs";
import unicornConfig from "./unicorn.config.mjs";

/*
 * ─────────────────────────────────────────────────────────────────────────
 * FRONTEND STRANGLER-FIG SCOPE (read before widening)
 * ─────────────────────────────────────────────────────────────────────────
 * The frontend architecture OS (the local `frontend-architecture` plugin plus
 * package-boundaries, strict a11y, and TanStack Query correctness) is wired in
 * below via the four `frontend*Config` groups. Every one of those configs is
 * scoped by `files` to the NEW canonical anatomy ONLY:
 *
 *     apps/web/src/modules/**   apps/web/src/packages/**   apps/web/src/shared/**
 *
 * (the exported `FRONTEND_ARCH_FILES` in ./frontend/architecture.config.mjs).
 *
 * Those folders do not exist yet, so `eslint .` matches zero files under them
 * and the repo stays 0/0 today — while ANY code later written in the
 * module/package/shared anatomy is fully governed from its first line.
 *
 * Deliberately OUT of scope (the pre-migration frontend — leave it green):
 *   apps/web/src/app  and  apps/web/src/{components,features,hooks,services,
 *   gateways,lib,i18n,...}. The repo-wide react/react-hooks/next/jsx-a11y
 *   (recommended) configs still cover those files; the strict architecture
 *   layer does not.
 *
 * HOW TO WIDEN once apps/web adopts the anatomy:
 *   1. Migrate a slice of pre-migration code into apps/web/src/modules/<feature>
 *      (or packages/shared), fix the violations the rules surface.
 *   2. When app routes are ready, add 'apps/web/src/app/**\/*.{ts,tsx}' to
 *      FRONTEND_ARCH_FILES so route files are governed too.
 *   3. Retire each legacy folder as its code moves under the anatomy.
 * The backend `architecture` plugin/config is entirely independent and
 * unaffected by any of this.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * Composition order matters:
 * ignores → base → typescript → imports → quality plugins → framework
 * plugins → backend architecture → frontend architecture (scoped) → test
 * overrides → prettier (always last).
 */
export default [
  ...ignoresConfig,
  ...baseConfig,
  // Absolute ban on eslint-disable / suppression directives (no exceptions).
  ...eslintCommentsConfig,
  ...typescriptConfig,
  ...importsConfig,
  ...promiseConfig,
  ...securityConfig,
  ...sonarConfig,
  ...unicornConfig,
  ...regexpConfig,
  ...reactConfig,
  ...reactHooksConfig,
  ...nextConfig,
  ...architectureConfig,
  // Frontend architecture OS — scoped to apps/web/src/{modules,packages,shared}
  // only (strangler-fig; see the block above).
  ...frontendArchitectureConfig,
  ...frontendPackageBoundariesConfig,
  ...frontendTanstackQueryConfig,
  ...frontendAccessibilityConfig,
  ...testConfig,
  ...prettierConfig,
];
