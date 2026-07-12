/**
 * Config scanner — builds `.ai/manifests/configs.json`: every environment
 * variable known to the repository, from two evidence sources: the
 * `.env.example` template (name, example value, preceding comment) and actual
 * `process.env.X` reads in source. Keys present in only one source are
 * flagged so drift is visible.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText } from './lib/fs-walk.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { scanSource } from './scan-source.mjs';

const ENV_EXAMPLE = '.env.example';
const ENV_LINE_PATTERN = /^([A-Z][A-Z0-9_]*)=(.*)$/;
const ENV_READ_PATTERN = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g;

const parseEnvExample = () => {
  if (!fileExists(ENV_EXAMPLE)) {
    return new Map();
  }
  const entries = new Map();
  let pendingComment = [];
  for (const line of readText(ENV_EXAMPLE).split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      pendingComment.push(trimmed.replace(/^#\s?/, ''));
      continue;
    }
    const match = ENV_LINE_PATTERN.exec(trimmed);
    if (match !== null) {
      entries.set(match[1], { description: pendingComment.join(' '), example: match[2] });
    }
    pendingComment = [];
  }
  return entries;
};

const collectEnvReads = (repository) => {
  const reads = new Map();
  for (const file of repository.files) {
    const text = readText(file.path);
    for (const match of text.matchAll(ENV_READ_PATTERN)) {
      const name = match[1] ?? match[2];
      if (name !== undefined) {
        const paths = reads.get(name) ?? new Set();
        paths.add(file.path);
        reads.set(name, paths);
      }
    }
  }
  return reads;
};

export const scanConfig = (repository = scanSource()) => {
  const documented = parseEnvExample();
  const reads = collectEnvReads(repository);
  const names = [...new Set([...documented.keys(), ...reads.keys()])].toSorted((a, b) =>
    a.localeCompare(b),
  );
  const configs = names.map((name) => ({
    description: documented.get(name)?.description ?? '',
    example: documented.get(name)?.example ?? null,
    inEnvExample: documented.has(name),
    isPublic: name.startsWith('NEXT_PUBLIC_'),
    name,
    readBy: [...(reads.get(name) ?? [])].toSorted((a, b) => a.localeCompare(b)),
  }));
  return {
    configs,
    count: configs.length,
    undocumented: configs.filter((entry) => !entry.inEnvExample).map((entry) => entry.name),
  };
};

export const writeConfigsManifest = (repository = scanSource()) => {
  const manifest = scanConfig(repository);
  const inputs = new Set([ENV_EXAMPLE]);
  for (const entry of manifest.configs) {
    for (const path of entry.readBy) {
      inputs.add(path);
    }
  }
  writeGeneratedJson(
    `${AI_DIRS.manifests}/configs.json`,
    manifest,
    [...inputs].filter((path) => fileExists(path)),
  );
  return `${manifest.count} env keys (${manifest.undocumented.length} undocumented)`;
};

await runAsCli(import.meta.url, 'scan-config', () => writeConfigsManifest());
