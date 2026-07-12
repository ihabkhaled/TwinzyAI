/**
 * Incremental knowledge build — compares current source/document hashes with
 * the last build's snapshots and rebuilds only the affected side. Any change
 * under knowledge/ (routing/pack/bootstrap definitions) forces a full build
 * because everything compiles from those definitions.
 */
import { buildAll } from './build.mjs';
import { buildCurrentState } from './build-current-state.mjs';
import { buildGraphs } from './build-graphs.mjs';
import { buildIndexes } from './build-indexes.mjs';
import { buildSummaries } from './build-summaries.mjs';
import { writeHashSnapshots } from './calculate-hashes.mjs';
import { findStaleItems } from './find-stale-items.mjs';
import { runAsCli } from './lib/cli.mjs';
import { fileExists } from './lib/fs-walk.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { readJson } from './lib/stable-json.mjs';
import { writeConfigsManifest } from './scan-config.mjs';
import { writeDependenciesManifests } from './scan-dependencies.mjs';
import { scanDocuments, writeDocumentsManifest } from './scan-documents.mjs';
import { writeErrorsManifest } from './scan-errors.mjs';
import { writeOwnershipManifest } from './scan-ownership.mjs';
import { writePromptsManifest } from './scan-prompts.mjs';
import { writeRoutesManifest } from './scan-routes.mjs';
import { writeContractsManifest } from './scan-schemas.mjs';
import { scanSource, writeRepositoryManifest } from './scan-source.mjs';
import { writeSymbolsManifest } from './scan-symbols.mjs';
import { writeTestsManifest } from './scan-tests.mjs';

const diffKeys = (current, previous) => {
  const changed = [];
  for (const [path, hash] of Object.entries(current)) {
    if (previous[path] !== hash) {
      changed.push(path);
    }
  }
  for (const path of Object.keys(previous)) {
    if (current[path] === undefined) {
      changed.push(path);
    }
  }
  return changed;
};

const currentHashesOf = (entries) =>
  Object.fromEntries(entries.map((entry) => [entry.path, entry.hash]));

export const buildIncremental = () => {
  const sourceSnapshotPath = `${AI_DIRS.hashes}/source-hashes.json`;
  const documentSnapshotPath = `${AI_DIRS.hashes}/document-hashes.json`;
  if (!fileExists(sourceSnapshotPath) || !fileExists(documentSnapshotPath)) {
    console.log('  no snapshots — running full build');
    return buildAll();
  }
  const repository = scanSource();
  const documents = scanDocuments();
  const changedSource = diffKeys(currentHashesOf(repository.files), readJson(sourceSnapshotPath));
  const changedDocuments = diffKeys(
    currentHashesOf(documents.documents),
    readJson(documentSnapshotPath),
  );
  const knowledgeChanged = changedDocuments.some((path) => path.startsWith('knowledge/'));

  if (changedSource.length === 0 && changedDocuments.length === 0) {
    return 'up to date — nothing changed since last build';
  }
  if (knowledgeChanged) {
    console.log('  knowledge/ definitions changed — running full build');
    return buildAll();
  }

  console.log(
    `  incremental: ${changedSource.length} source, ${changedDocuments.length} document change(s)`,
  );
  const staleItems = findStaleItems();
  console.log(`  find-stale-items: ${staleItems.length} (review-required recorded)`);
  if (changedSource.length > 0) {
    writeRepositoryManifest(repository);
    writeSymbolsManifest(repository);
    writeTestsManifest(repository);
    writeRoutesManifest(repository);
    writeContractsManifest(repository);
    writeErrorsManifest(repository);
    writeConfigsManifest(repository);
    writePromptsManifest();
    writeDependenciesManifests(repository);
    writeOwnershipManifest(repository);
    console.log('  source manifests refreshed');
  }
  if (changedDocuments.length > 0) {
    writeDocumentsManifest();
    console.log('  documents manifest refreshed');
  }
  console.log(`  build-indexes: ${buildIndexes({ repository, documents })}`);
  console.log(`  build-graphs: ${buildGraphs({ repository, documents })}`);
  if (changedDocuments.length > 0) {
    console.log(`  build-summaries: ${buildSummaries()}`);
  }
  console.log(`  build-current-state: ${buildCurrentState({ repository, documents })}`);
  console.log(`  calculate-hashes: ${writeHashSnapshots({ repository, documents })}`);
  return `incremental build complete (${changedSource.length + changedDocuments.length} changed inputs)`;
};

await runAsCli(import.meta.url, 'build-incremental', () => buildIncremental());
