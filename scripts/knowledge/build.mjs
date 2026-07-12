/**
 * Full knowledge build — deterministically recompiles the entire `.ai/`
 * acceleration plane from the canonical plane. Order matters: scans →
 * indexes/graphs → compiled artifacts → analyses → hash snapshots (last, so
 * the snapshots describe the state this build saw).
 */
import { buildBootstrap } from './build-bootstrap.mjs';
import { buildCurrentState } from './build-current-state.mjs';
import { buildGraphs } from './build-graphs.mjs';
import { buildHotMemory } from './build-hot-memory.mjs';
import { buildIndexes } from './build-indexes.mjs';
import { buildPacks } from './build-packs.mjs';
import { buildQuickRouter } from './build-quick-router.mjs';
import { buildSummaries } from './build-summaries.mjs';
import { writeHashSnapshots } from './calculate-hashes.mjs';
import { findContradictions } from './find-contradictions.mjs';
import { findDuplicates } from './find-duplicates.mjs';
import { findOrphans } from './find-orphans.mjs';
import { findStaleItems } from './find-stale-items.mjs';
import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText, writeText } from './lib/fs-walk.mjs';
import { AI_DIRS, AI_ROOT } from './lib/paths.mjs';
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

const writeAiReadme = () => {
  writeText(
    `${AI_ROOT}/README.md`,
    `<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/templates/ai-readme.md -->

${readText('knowledge/templates/ai-readme.md')}`,
  );
  if (!fileExists(`${AI_DIRS.local}/.gitkeep`)) {
    writeText(`${AI_DIRS.local}/.gitkeep`, '');
  }
};

export const buildAll = () => {
  const repository = scanSource();
  const shared = { repository };

  const steps = [
    ['scan-source', () => writeRepositoryManifest(repository)],
    ['scan-documents', () => writeDocumentsManifest()],
    ['scan-symbols', () => writeSymbolsManifest(repository)],
    ['scan-tests', () => writeTestsManifest(repository)],
    ['scan-routes', () => writeRoutesManifest(repository)],
    ['scan-schemas', () => writeContractsManifest(repository)],
    ['scan-errors', () => writeErrorsManifest(repository)],
    ['scan-config', () => writeConfigsManifest(repository)],
    ['scan-prompts', () => writePromptsManifest()],
    ['scan-dependencies', () => writeDependenciesManifests(repository)],
    ['scan-ownership', () => writeOwnershipManifest(repository)],
  ];
  for (const [label, step] of steps) {
    console.log(`  ${label}: ${step()}`);
  }

  const documents = scanDocuments();
  shared.documents = documents;
  console.log(`  build-indexes: ${buildIndexes(shared)}`);
  console.log(`  build-graphs: ${buildGraphs(shared)}`);
  console.log(`  build-packs: ${buildPacks(shared)}`);
  console.log(`  build-bootstrap: ${buildBootstrap()}`);
  console.log(`  build-hot-memory: ${buildHotMemory()}`);
  console.log(`  build-summaries: ${buildSummaries()}`);
  console.log(`  build-quick-router: ${buildQuickRouter()}`);
  writeAiReadme();

  console.log(`  find-stale-items: ${findStaleItems().length} (pre-snapshot)`);
  const { findings, registryOpen } = findContradictions();
  console.log(
    `  find-contradictions: ${findings.length} findings, ${registryOpen.length} open registry`,
  );
  const duplicates = findDuplicates(documents);
  console.log(
    `  find-duplicates: ${duplicates.duplicateIds.length} id / ${duplicates.duplicateTitles.length} title groups`,
  );
  console.log(`  find-orphans: ${findOrphans(documents).length} candidates`);
  console.log(`  build-current-state: ${buildCurrentState(shared)}`);
  console.log(`  calculate-hashes: ${writeHashSnapshots(shared)}`);

  if (findings.length > 0) {
    throw new Error(
      `contradiction check findings block the build: ${findings.map((finding) => finding.checkId).join(', ')}`,
    );
  }
  return 'full build complete';
};

await runAsCli(import.meta.url, 'build', () => buildAll());
