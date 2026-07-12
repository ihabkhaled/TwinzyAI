/**
 * Symbol scanner — builds `.ai/manifests/symbols.json`: every exported symbol
 * in production source (tests excluded) with its file, module, and layer, so
 * the context resolver can route symbol mentions straight to their owner.
 */
import { runAsCli } from './lib/cli.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { scanSource } from './scan-source.mjs';

export const scanSymbols = (repository = scanSource()) => {
  const symbols = [];
  for (const file of repository.files) {
    if (file.isTest) {
      continue;
    }
    for (const exported of file.exports) {
      symbols.push({
        kind: exported.kind,
        layer: file.layer,
        module: file.module,
        name: exported.name,
        path: file.path,
      });
    }
  }
  const sorted = symbols.toSorted(
    (a, b) => a.name.localeCompare(b.name) || a.path.localeCompare(b.path),
  );
  return { count: sorted.length, symbols: sorted };
};

export const writeSymbolsManifest = (repository = scanSource()) => {
  const manifest = scanSymbols(repository);
  writeGeneratedJson(
    `${AI_DIRS.manifests}/symbols.json`,
    manifest,
    repository.files.map((file) => file.path),
  );
  return `${manifest.count} exported symbols`;
};

await runAsCli(import.meta.url, 'scan-symbols', () => writeSymbolsManifest());
