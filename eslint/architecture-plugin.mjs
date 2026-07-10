import applicationLayerBoundaries from "./architecture-plugin/rules/application-layer-boundaries.mjs";
import controllerNoLogic from "./architecture-plugin/rules/controller-no-logic.mjs";
import noDirectEnvAccess from "./architecture-plugin/rules/no-direct-env-access.mjs";
import noDirectSdkImports from "./architecture-plugin/rules/no-direct-sdk-imports.mjs";
import noInlineDomainDefinitions from "./architecture-plugin/rules/no-inline-domain-definitions.mjs";
import noRawLibraryImports from "./architecture-plugin/rules/no-raw-library-imports.mjs";
import noReactInPureLayers from "./architecture-plugin/rules/no-react-in-pure-layers.mjs";
import noRestrictedLayerImports from "./architecture-plugin/rules/no-restricted-layer-imports.mjs";
import noRestrictedVendorImports from "./architecture-plugin/rules/no-restricted-vendor-imports.mjs";
import repositoryPersistenceOnly from "./architecture-plugin/rules/repository-persistence-only.mjs";
import tsxPureComposition from "./architecture-plugin/rules/tsx-pure-composition.mjs";

/**
 * Custom architecture ESLint plugin for the Twinzy monorepo.
 * Encodes the non-negotiable layer rules so they fail CI, not review.
 */
const architecturePlugin = {
  meta: {
    name: "eslint-plugin-twinzy-architecture",
    version: "0.2.0",
  },
  rules: {
    "controller-no-logic": controllerNoLogic,
    "application-layer-boundaries": applicationLayerBoundaries,
    "no-restricted-layer-imports": noRestrictedLayerImports,
    "no-restricted-vendor-imports": noRestrictedVendorImports,
    "no-inline-domain-definitions": noInlineDomainDefinitions,
    "no-direct-sdk-imports": noDirectSdkImports,
    "no-direct-env-access": noDirectEnvAccess,
    "no-raw-library-imports": noRawLibraryImports,
    "no-react-in-pure-layers": noReactInPureLayers,
    "tsx-pure-composition": tsxPureComposition,
    "repository-persistence-only": repositoryPersistenceOnly,
  },
};

export default architecturePlugin;
