/**
 * Error scanner — builds `.ai/manifests/errors.json`: every exported error
 * class, exception, and error-code catalog so failures can be routed to their
 * owning module and support documentation.
 */
import { runAsCli } from './lib/cli.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { scanSource } from './scan-source.mjs';

const classifyErrorExport = (path, exported) => {
  if (/(?:Error|Exception)$/.test(exported.name) && exported.kind === 'class') {
    return 'error-class';
  }
  if (/(?:ERROR|_CODES?)(?:_|$)/.test(exported.name)) {
    return 'error-catalog';
  }
  if (path.includes('/errors/') || path.endsWith('.errors.ts')) {
    return 'error-file-export';
  }
  return null;
};

export const scanErrors = (repository = scanSource()) => {
  const errors = [];
  for (const file of repository.files) {
    if (file.isTest) {
      continue;
    }
    for (const exported of file.exports) {
      const kind = classifyErrorExport(file.path, exported);
      if (kind !== null) {
        errors.push({ kind, module: file.module, name: exported.name, path: file.path });
      }
    }
  }
  const sorted = errors.toSorted(
    (a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name),
  );
  return { count: sorted.length, errors: sorted };
};

export const writeErrorsManifest = (repository = scanSource()) => {
  const manifest = scanErrors(repository);
  writeGeneratedJson(
    `${AI_DIRS.manifests}/errors.json`,
    manifest,
    [...new Set(manifest.errors.map((error) => error.path))].toSorted((a, b) => a.localeCompare(b)),
  );
  return `${manifest.count} error exports`;
};

await runAsCli(import.meta.url, 'scan-errors', () => writeErrorsManifest());
