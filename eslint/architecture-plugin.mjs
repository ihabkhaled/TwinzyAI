import controllerNoLogic from './architecture-plugin/rules/controller-no-logic.mjs';
import managerLayerBoundaries from './architecture-plugin/rules/manager-layer-boundaries.mjs';
import noDirectEnvAccess from './architecture-plugin/rules/no-direct-env-access.mjs';
import noDirectSdkImports from './architecture-plugin/rules/no-direct-sdk-imports.mjs';
import noInlineDomainDefinitions from './architecture-plugin/rules/no-inline-domain-definitions.mjs';
import noRawLibraryImports from './architecture-plugin/rules/no-raw-library-imports.mjs';
import noRestrictedLayerImports from './architecture-plugin/rules/no-restricted-layer-imports.mjs';
import repositoryPersistenceOnly from './architecture-plugin/rules/repository-persistence-only.mjs';
import tsxPureComposition from './architecture-plugin/rules/tsx-pure-composition.mjs';

/**
 * Custom architecture ESLint plugin for the Twinzy monorepo.
 * Encodes the non-negotiable layer rules so they fail CI, not review.
 */
export const architecturePlugin = {
  meta: {
    name: 'eslint-plugin-twinzy-architecture',
    version: '0.1.0',
  },
  rules: {
    'controller-no-logic': controllerNoLogic,
    'manager-layer-boundaries': managerLayerBoundaries,
    'no-restricted-layer-imports': noRestrictedLayerImports,
    'no-inline-domain-definitions': noInlineDomainDefinitions,
    'no-direct-sdk-imports': noDirectSdkImports,
    'no-direct-env-access': noDirectEnvAccess,
    'no-raw-library-imports': noRawLibraryImports,
    'tsx-pure-composition': tsxPureComposition,
    'repository-persistence-only': repositoryPersistenceOnly,
  },
};

export default architecturePlugin;
