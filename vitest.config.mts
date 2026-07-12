import path from 'node:path';

import react from '@vitejs/plugin-react';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const rootDir = import.meta.dirname;

const NODE_MODULES_GLOB = '**/node_modules/**';

/**
 * SWC transform for NestJS projects: esbuild (Vitest's default) cannot emit
 * the decorator metadata Nest dependency injection relies on.
 */
const nestSwcPlugin = swc.vite({
  module: { type: 'es6' },
  jsc: {
    parser: { syntax: 'typescript', decorators: true },
    transform: { legacyDecorator: true, decoratorMetadata: true },
    target: 'es2022',
  },
});

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [nestSwcPlugin],
        oxc: false,
        test: {
          name: 'api-unit',
          root: path.resolve(rootDir, 'apps/api'),
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: [NODE_MODULES_GLOB, 'src/**/*.integration.test.ts'],
          // Pin the paid-analysis paywall OFF so tests are deterministic
          // regardless of a developer's local .env credentials. dotenv never
          // overrides an already-set process.env key, so these empty values
          // win; the paywall suite opts back in with vi.stubEnv.
          env: { PAYPAL_CLIENT_ID: '', PAYPAL_CLIENT_SECRET: '' },
        },
      },
      {
        plugins: [nestSwcPlugin],
        oxc: false,
        test: {
          name: 'api-integration',
          root: path.resolve(rootDir, 'apps/api'),
          environment: 'node',
          include: ['src/**/*.integration.test.ts'],
          exclude: [NODE_MODULES_GLOB],
          env: { PAYPAL_CLIENT_ID: '', PAYPAL_CLIENT_SECRET: '' },
        },
      },
      {
        test: {
          name: 'lint-rules',
          root: path.resolve(rootDir, 'eslint'),
          environment: 'node',
          include: [
            'architecture-plugin/tests/**/*.test.mjs',
            'frontend-architecture-plugin/tests/**/*.test.mjs',
          ],
          exclude: [NODE_MODULES_GLOB],
        },
      },
      {
        test: {
          name: 'shared-unit',
          root: path.resolve(rootDir, 'packages/shared'),
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: [NODE_MODULES_GLOB],
        },
      },
      {
        plugins: [react()],
        resolve: {
          alias: { '@': path.resolve(rootDir, 'apps/web/src') },
        },
        test: {
          name: 'web-unit',
          root: path.resolve(rootDir, 'apps/web'),
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: [NODE_MODULES_GLOB, 'e2e/**'],
          setupFiles: ['src/tests/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: path.resolve(rootDir, 'coverage'),
      // Gated scope = the logic-bearing files only (testing/coverage-policy.md).
      // Deliberately EXCLUDED because they carry no branchable logic or wrap an
      // un-runnable external boundary exercised only through integration stubs:
      // adapters/ (Gemini SDK, clamd TCP), model/ + enums + constants + types,
      // dto/ (zod schema declarations), error subclasses (one-line status), the
      // *.vendor re-exports, bind-app-logger + module wiring, bootstrap/, main,
      // and the openapi surface. Frontend modules/packages/shared code is
      // included; declaration/constants/variant files remain excluded.
      include: [
        'apps/api/src/core/errors/error-body.mapper.ts',
        'apps/api/src/core/errors/app-exception.filter.ts',
        'apps/api/src/core/logger/app-logger.service.ts',
        'apps/api/src/core/logger/http-logging.options.ts',
        'apps/api/src/core/validation/validation-exception.factory.ts',
        'apps/api/src/core/validation/zod-issue.mapper.ts',
        'apps/api/src/core/http/multipart-upload.parser.ts',
        'apps/api/src/core/http/uploaded-image.interceptor.ts',
        'apps/api/src/core/concurrency/semaphore.ts',
        'apps/api/src/core/streaming/concurrency-limiter.service.ts',
        'apps/api/src/core/streaming/stream-registry.service.ts',
        'apps/api/src/modules/**/application/**/*.ts',
        'apps/api/src/modules/**/infrastructure/**/*.ts',
        'apps/api/src/modules/**/lib/**/*.ts',
        'apps/web/src/modules/**/helpers/**/*.ts',
        'apps/web/src/modules/**/mappers/**/*.ts',
        'apps/web/src/modules/**/services/**/*.ts',
        'apps/web/src/modules/**/gateway/**/*.ts',
        'apps/web/src/modules/**/schemas/**/*.ts',
        'apps/web/src/modules/game/hooks/useShareCreate.hook.ts',
        'apps/web/src/modules/ui-preferences/hooks/**/*.ts',
        'apps/web/src/modules/ui-preferences/store/**/*.ts',
        'apps/web/src/packages/axios/{http-error,stream-request}.ts',
        'apps/web/src/packages/browser/browser-environment.ts',
        'apps/web/src/packages/storage/*.ts',
        'apps/web/src/shared/helpers/**/*.ts',
        'apps/web/src/shared/hooks/**/*.ts',
        'packages/shared/src/utils/**/*.ts',
      ],
      exclude: [
        '**/tests/**',
        '**/test/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        '**/index.ts',
        '**/*.types.ts',
        '**/*.constants.ts',
        '**/*.variants.ts',
        '**/*.enum.ts',
      ],
      // Branch floor is 90 (not 95) because the decorator downlevel emits one
      // uncoverable synthetic branch per decorated class (@Injectable services),
      // plus a handful of provider I/O abort/error edges that are not worth the
      // heavy mock scaffolding. Statement/function/line floors stay high (95),
      // and pure-logic libs are effectively fully covered by direct unit tests.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});
