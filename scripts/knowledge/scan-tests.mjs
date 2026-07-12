/**
 * Test scanner — builds `.ai/manifests/tests.json`: every test file with its
 * kind (unit / integration / e2e) and the source files it exercises, resolved
 * from its relative imports. Explicit import edges only — no guessing.
 */
import { runAsCli } from './lib/cli.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { resolveRelativeImport } from './lib/resolve-import.mjs';
import { scanSource } from './scan-source.mjs';

const kindOf = (path) => {
  if (path.startsWith('apps/web/e2e/')) {
    return 'e2e';
  }
  return path.includes('.integration.') ? 'integration' : 'unit';
};

const targetsOf = (file, knownPaths) => {
  const targets = new Set();
  for (const specifier of file.imports) {
    const resolved = resolveRelativeImport(file.path, specifier, knownPaths);
    if (resolved !== null && !resolved.includes('.test.') && !resolved.includes('.spec.')) {
      targets.add(resolved);
    }
  }
  return [...targets].toSorted((a, b) => a.localeCompare(b));
};

export const scanTests = (repository = scanSource()) => {
  const knownPaths = new Set(repository.files.map((file) => file.path));
  const tests = repository.files
    .filter((file) => file.isTest)
    .map((file) => ({
      kind: kindOf(file.path),
      module: file.module,
      path: file.path,
      targets: targetsOf(file, knownPaths),
    }));
  return { count: tests.length, tests };
};

export const writeTestsManifest = (repository = scanSource()) => {
  const manifest = scanTests(repository);
  writeGeneratedJson(
    `${AI_DIRS.manifests}/tests.json`,
    manifest,
    repository.files.map((file) => file.path),
  );
  return `${manifest.count} test files`;
};

await runAsCli(import.meta.url, 'scan-tests', () => writeTestsManifest());
