import architectureConfig from "./architecture.config.mjs";
import baseConfig from "./base.config.mjs";
import eslintCommentsConfig from "./eslint-comments.config.mjs";
import frontendAccessibilityConfig from "./frontend/accessibility.config.mjs";
import frontendArchitectureConfig from "./frontend/architecture.config.mjs";
import frontendComponentSizeConfig from "./frontend/component-size.config.mjs";
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
 * FRONTEND ARCHITECTURE SCOPE
 * ─────────────────────────────────────────────────────────────────────────
 * The frontend architecture OS (the local `frontend-architecture` plugin plus
 * package-boundaries, strict a11y, small-components, and TanStack Query
 * correctness) is wired in below via the `frontend*Config` groups. The
 * `apps/web` migration to the module/package/shared anatomy is COMPLETE, so
 * those configs govern the full app surface:
 *
 *     apps/web/src/modules/**   apps/web/src/packages/**
 *     apps/web/src/shared/**    apps/web/src/app/**   apps/web/src/proxy.ts
 *
 * (the exported `FRONTEND_ARCH_FILES` in ./frontend/architecture.config.mjs).
 * The pre-migration folders (components/features/lib/i18n/constants/styles)
 * were deleted in the app-shell cutover; there is no legacy frontend left to
 * exclude. The backend `architecture` plugin/config is independent of this.
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
  // "Split components into small chunks": tight size limits on component/
  // container files, forcing decomposition before a god-component forms.
  ...frontendComponentSizeConfig,
  ...frontendPackageBoundariesConfig,
  ...frontendTanstackQueryConfig,
  ...frontendAccessibilityConfig,
  ...testConfig,
  ...prettierConfig,
];
