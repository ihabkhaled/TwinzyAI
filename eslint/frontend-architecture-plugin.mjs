/**
 * Local ESLint plugin: frontend-architecture
 *
 * A SEPARATE plugin from the backend `architecture` plugin
 * (eslint/architecture-plugin.mjs). It encodes the frontend architecture
 * contract for `apps/web/src` that no off-the-shelf plugin can: JSX-only
 * components, layered one-way imports, vendor package boundaries, env/browser
 * facades, query-key builders, i18n copy discipline, and justified client
 * boundaries.
 *
 * These rules only ever run on files the composition entrypoint scopes them to
 * (the module/package/shared anatomy under apps/web/src) — see the
 * strangler-fig note in eslint/index.mjs.
 */

import noCrossModuleDeepImports from "./frontend-architecture-plugin/rules/no-cross-module-deep-imports.mjs";
import noDirectBrowserApiOutsidePackages from "./frontend-architecture-plugin/rules/no-direct-browser-api-outside-packages.mjs";
import noHooksInComponents from "./frontend-architecture-plugin/rules/no-hooks-in-components.mjs";
import noInlineClassnameOutsideDesignSystem from "./frontend-architecture-plugin/rules/no-inline-classname-outside-design-system.mjs";
import noInlineComponentLogic from "./frontend-architecture-plugin/rules/no-inline-component-logic.mjs";
import noInlineDeclarations from "./frontend-architecture-plugin/rules/no-inline-declarations.mjs";
import noInlineQueryKeys from "./frontend-architecture-plugin/rules/no-inline-query-keys.mjs";
import noProcessEnvOutsideConfig from "./frontend-architecture-plugin/rules/no-process-env-outside-config.mjs";
import noRawI18nText from "./frontend-architecture-plugin/rules/no-raw-i18n-text.mjs";
import noRawPackageImports from "./frontend-architecture-plugin/rules/no-raw-package-imports.mjs";
import noRestrictedLayerImports from "./frontend-architecture-plugin/rules/no-restricted-layer-imports.mjs";
import noServerOnlyImportInClient from "./frontend-architecture-plugin/rules/no-server-only-import-in-client.mjs";
import requireClientComponentReason from "./frontend-architecture-plugin/rules/require-client-component-reason.mjs";

export const frontendArchitecturePlugin = {
  meta: {
    name: "eslint-plugin-twinzy-frontend-architecture",
    version: "1.0.0",
  },
  rules: {
    "no-cross-module-deep-imports": noCrossModuleDeepImports,
    "no-direct-browser-api-outside-packages": noDirectBrowserApiOutsidePackages,
    "no-hooks-in-components": noHooksInComponents,
    "no-inline-classname-outside-design-system":
      noInlineClassnameOutsideDesignSystem,
    "no-inline-component-logic": noInlineComponentLogic,
    "no-inline-declarations": noInlineDeclarations,
    "no-inline-query-keys": noInlineQueryKeys,
    "no-process-env-outside-config": noProcessEnvOutsideConfig,
    "no-raw-i18n-text": noRawI18nText,
    "no-raw-package-imports": noRawPackageImports,
    "no-restricted-layer-imports": noRestrictedLayerImports,
    "no-server-only-import-in-client": noServerOnlyImportInClient,
    "require-client-component-reason": requireClientComponentReason,
  },
};
