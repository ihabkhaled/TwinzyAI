import architectureConfig from './architecture.config.mjs';
import baseConfig from './base.config.mjs';
import ignoresConfig from './ignores.config.mjs';
import importsConfig from './imports.config.mjs';
import nextConfig from './next.config.mjs';
import prettierConfig from './prettier.config.mjs';
import promiseConfig from './promise.config.mjs';
import reactConfig from './react.config.mjs';
import reactHooksConfig from './react-hooks.config.mjs';
import regexpConfig from './regexp.config.mjs';
import securityConfig from './security.config.mjs';
import sonarConfig from './sonar.config.mjs';
import testConfig from './test.config.mjs';
import typescriptConfig from './typescript.config.mjs';
import unicornConfig from './unicorn.config.mjs';

/**
 * Composition order matters:
 * ignores → base → typescript → imports → quality plugins → framework
 * plugins → architecture → test overrides → prettier (always last).
 */
export default [
  ...ignoresConfig,
  ...baseConfig,
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
  ...testConfig,
  ...prettierConfig,
];
