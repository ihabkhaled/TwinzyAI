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
      include: ['apps/api/src/**', 'apps/web/src/**', 'packages/shared/src/**'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/tests/**',
        '**/*.d.ts',
        'apps/api/src/main.ts',
        'apps/web/src/app/**',
      ],
    },
  },
});
