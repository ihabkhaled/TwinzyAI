/**
 * Schema/contract scanner — builds `.ai/manifests/contracts.json`: every
 * exported zod schema and DTO (the shared api↔web contract surface), plus
 * which files consume each shared schema.
 */
import { runAsCli } from './lib/cli.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { resolveRelativeImport } from './lib/resolve-import.mjs';
import { scanSource } from './scan-source.mjs';

const isSchemaExport = (name) => name.endsWith('Schema');

const isDtoFile = (path) => path.includes('/dto/') || path.endsWith('.dto.ts');

const isSchemaFile = (path) => path.includes('/schemas/') || path.endsWith('.schemas.ts');

const kindOf = (path, name) => {
  if (isDtoFile(path)) {
    return 'dto';
  }
  return isSchemaExport(name) ? 'zod-schema' : 'schema-file-export';
};

const consumersByPath = (repository) => {
  const knownPaths = new Set(repository.files.map((file) => file.path));
  const consumers = new Map();
  for (const file of repository.files) {
    for (const specifier of file.imports) {
      const resolved = resolveRelativeImport(file.path, specifier, knownPaths);
      if (resolved !== null) {
        const list = consumers.get(resolved) ?? [];
        list.push(file.path);
        consumers.set(resolved, list);
      }
    }
  }
  return consumers;
};

export const scanSchemas = (repository = scanSource()) => {
  const consumers = consumersByPath(repository);
  const contracts = [];
  for (const file of repository.files) {
    if (file.isTest || (!isDtoFile(file.path) && !isSchemaFile(file.path))) {
      continue;
    }
    for (const exported of file.exports) {
      contracts.push({
        kind: kindOf(file.path, exported.name),
        module: file.module,
        name: exported.name,
        path: file.path,
        usedBy: [...new Set(consumers.get(file.path))].toSorted((a, b) => a.localeCompare(b)),
      });
    }
  }
  const sorted = contracts.toSorted(
    (a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name),
  );
  return { contracts: sorted, count: sorted.length };
};

export const writeContractsManifest = (repository = scanSource()) => {
  const manifest = scanSchemas(repository);
  writeGeneratedJson(
    `${AI_DIRS.manifests}/contracts.json`,
    manifest,
    [...new Set(manifest.contracts.map((contract) => contract.path))].toSorted((a, b) =>
      a.localeCompare(b),
    ),
  );
  return `${manifest.count} contract exports`;
};

await runAsCli(import.meta.url, 'scan-schemas', () => writeContractsManifest());
