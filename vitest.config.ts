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
        },
      },
      {
        test: {
          name: 'lint-rules',
          root: path.resolve(rootDir, 'eslint'),
          environment: 'node',
          include: ['architecture-plugin/tests/**/*.test.mjs'],
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
      // and the openapi surface. apps/web is waived to the web workstream.
      include: [
        'apps/api/src/core/errors/error-body.mapper.ts',
        'apps/api/src/core/errors/app-exception.filter.ts',
        'apps/api/src/core/logger/app-logger.service.ts',
        'apps/api/src/core/logger/http-logging.options.ts',
        'apps/api/src/core/validation/validation-exception.factory.ts',
        'apps/api/src/core/validation/zod-issue.mapper.ts',
        'apps/api/src/core/http/multipart-upload.parser.ts',
        'apps/api/src/core/http/uploaded-image.interceptor.ts',
        'apps/api/src/modules/**/application/**/*.ts',
        'apps/api/src/modules/**/infrastructure/**/*.ts',
        'apps/api/src/modules/**/lib/**/*.ts',
        'packages/shared/src/utils/**/*.ts',
      ],
      exclude: ['**/tests/**', '**/*.test.ts', '**/*.test.tsx', '**/*.d.ts', '**/index.ts'],
      // Branch floor is 90 (not 95) solely because the decorator downlevel
      // emits one uncoverable synthetic branch per decorated class.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});
