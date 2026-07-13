/**
 * Source scanner — builds `.ai/manifests/repository.json`, the file-level
 * inventory of all TypeScript source: module, layer, exports, imports, size.
 * Everything downstream (symbols, tests, routes, graphs) derives from it.
 */
import { runAsCli } from './lib/cli.mjs';
import { readText, walkFiles } from './lib/fs-walk.mjs';
import { sha256Text } from './lib/hashing.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS, SOURCE_ROOTS } from './lib/paths.mjs';
import {
  countLines,
  extractExports,
  extractImports,
  isTestFile,
  layerOf,
  moduleOf,
} from './lib/source-scan.mjs';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

/** apps/web/e2e sits outside src but is part of the scanned surface (Playwright specs). */
const EXTRA_ROOTS = ['apps/web/e2e'];

/**
 * Deployment-only wrappers intentionally duplicate a canonical application
 * entrypoint and should not change the architecture inventory or generated
 * knowledge graph.
 */
const EXCLUDED_SOURCE_PATHS = new Set(['apps/api/src/server.ts']);

const buildEntry = (path) => {
  const text = readText(path);
  return {
    exports: extractExports(text),
    hash: sha256Text(text),
    imports: extractImports(text),
    isTest: isTestFile(path),
    layer: layerOf(path),
    loc: countLines(text),
    module: moduleOf(path),
    path,
  };
};

export const scanSource = () => {
  const paths = [];
  for (const root of [...SOURCE_ROOTS, ...EXTRA_ROOTS]) {
    paths.push(...walkFiles(root, { extensions: SOURCE_EXTENSIONS }));
  }
  const files = paths
    .toSorted((a, b) => a.localeCompare(b))
    .filter((path) => !path.endsWith('.d.ts') && !EXCLUDED_SOURCE_PATHS.has(path))
    .map((path) => buildEntry(path));
  return { count: files.length, files };
};

export const writeRepositoryManifest = () => {
  const manifest = scanSource();
  writeGeneratedJson(
    `${AI_DIRS.manifests}/repository.json`,
    manifest,
    manifest.files.map((file) => file.path),
  );
  return `${manifest.count} source files`;
};

await runAsCli(import.meta.url, 'scan-source', () => writeRepositoryManifest());
