/**
 * Staleness detector — two hash-based mechanisms, no calendar logic:
 *  1. generated-from drift: any `.ai/` artifact whose recorded input hashes
 *     no longer match reality needs `knowledge:build`.
 *  2. freshness triggers: source files matching a `freshness-policy.yaml`
 *     trigger changed since the last hash snapshot → the listed canonical
 *     docs become review-required.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists } from './lib/fs-walk.mjs';
import { combineHashes, hashFiles } from './lib/hashing.mjs';
import { generatedPath, readGeneratedFrom, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { readJson, writeJson } from './lib/stable-json.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

const POLICY_FILE = 'knowledge/freshness-policy.yaml';

const findGeneratedDrift = () => {
  const stale = [];
  for (const [output, record] of Object.entries(readGeneratedFrom())) {
    const existing = record.inputs.filter((input) => fileExists(input));
    const missing = record.inputs.filter((input) => !fileExists(input));
    for (const input of missing) {
      stale.push({ kind: 'artifact', reason: `input deleted: ${input}`, target: output });
    }
    if (missing.length === 0 && combineHashes(hashFiles(existing)) !== record.inputsHash) {
      stale.push({ kind: 'artifact', reason: 'inputs changed since last build', target: output });
    }
  }
  return stale;
};

const previousHashes = () => {
  const sourcePath = `${AI_DIRS.hashes}/source-hashes.json`;
  const documentPath = `${AI_DIRS.hashes}/document-hashes.json`;
  return {
    ...(fileExists(sourcePath) && readJson(sourcePath)),
    ...(fileExists(documentPath) && readJson(documentPath)),
  };
};

const findTriggeredReviews = () => {
  const policy = loadYamlFile(POLICY_FILE);
  const snapshot = previousHashes();
  const knownPaths = Object.keys(snapshot);
  const stale = [];
  const triggers = policy.triggers ?? [];
  for (const trigger of triggers) {
    const watched = knownPaths.filter((path) => path.includes(trigger.whenChanged));
    const changed = watched.filter(
      (path) => !fileExists(path) || hashFiles([path])[path] !== snapshot[path],
    );
    if (changed.length === 0) {
      continue;
    }
    for (const target of trigger.review) {
      stale.push({
        kind: 'review',
        reason: `trigger ${trigger.id}: ${changed.length} watched file(s) changed`,
        target,
      });
    }
  }
  return stale;
};

export const findStaleItems = () => {
  const staleItems = [...findGeneratedDrift(), ...findTriggeredReviews()].toSorted(
    (a, b) => a.target.localeCompare(b.target) || a.reason.localeCompare(b.reason),
  );
  const output = generatedPath('stale-items');
  writeJson(output, { staleItems });
  recordGeneratedFrom(output, [POLICY_FILE]);
  return staleItems;
};

await runAsCli(import.meta.url, 'find-stale-items', () => {
  const staleItems = findStaleItems();
  return `${staleItems.length} stale item(s)`;
});
