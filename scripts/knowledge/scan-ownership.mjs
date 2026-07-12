/**
 * Ownership scanner — builds `.ai/manifests/ownership.json`: one record per
 * source module, merged from the scan (files, layers) and the authored
 * `structure/ownership-map.yaml` (owner, lane, docs). Modules missing from
 * the authored map are listed so ownership gaps stay visible.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists } from './lib/fs-walk.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { loadYamlFileOptional } from './lib/yaml-io.mjs';
import { scanSource } from './scan-source.mjs';

const OWNERSHIP_MAP = 'structure/ownership-map.yaml';

const aggregateModules = (repository) => {
  const modules = new Map();
  for (const file of repository.files) {
    const record = modules.get(file.module) ?? {
      fileCount: 0,
      layers: new Set(),
      module: file.module,
      root: file.path.slice(0, file.path.lastIndexOf('/')),
    };
    record.fileCount += 1;
    record.layers.add(file.layer);
    const commonLength = commonPrefixLength(record.root, file.path);
    record.root = file.path.slice(0, commonLength).replace(/\/[^/]*$/, '');
    modules.set(file.module, record);
  }
  return modules;
};

const commonPrefixLength = (a, b) => {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) {
    index += 1;
  }
  return index;
};

export const scanOwnership = (repository = scanSource()) => {
  const authored = loadYamlFileOptional(OWNERSHIP_MAP, { modules: {} });
  const authoredModules = authored.modules ?? {};
  const modules = aggregateModules(repository)
    .values()
    .map((record) => {
      const overlay = authoredModules[record.module] ?? {};
      return {
        docs: overlay.docs ?? [],
        fileCount: record.fileCount,
        lane: overlay.lane ?? null,
        layers: [...record.layers].toSorted((a, b) => a.localeCompare(b)),
        module: record.module,
        owner: overlay.owner ?? 'unassigned',
        responsibility: overlay.responsibility ?? '',
        root: record.root,
      };
    })
    .toArray()
    .toSorted((a, b) => a.module.localeCompare(b.module));
  return {
    count: modules.length,
    modules,
    unmappedModules: modules
      .filter((record) => record.owner === 'unassigned')
      .map((record) => record.module),
  };
};

export const writeOwnershipManifest = (repository = scanSource()) => {
  const manifest = scanOwnership(repository);
  const inputs = repository.files.map((file) => file.path);
  if (fileExists(OWNERSHIP_MAP)) {
    inputs.push(OWNERSHIP_MAP);
  }
  writeGeneratedJson(`${AI_DIRS.manifests}/ownership.json`, manifest, inputs);
  return `${manifest.count} modules (${manifest.unmappedModules.length} unmapped)`;
};

await runAsCli(import.meta.url, 'scan-ownership', () => writeOwnershipManifest());
