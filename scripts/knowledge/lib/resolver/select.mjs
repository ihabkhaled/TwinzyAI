/**
 * Context selection — turns a classified task into the minimal context set:
 * pack, mandatory docs, code entrypoints, tests, reviewers, validation
 * commands, with a token estimate and explicit ambiguities. Reads only
 * compiled indexes/manifests; never rescans the repository.
 */
import { fileExists } from '../fs-walk.mjs';
import { manifestPath } from '../manifest-io.mjs';
import { AI_DIRS } from '../paths.mjs';
import { readJson } from '../stable-json.mjs';

const MAX_SOURCE_FILES = 20;
const MAX_TEST_FILES = 15;
const LOW_CONFIDENCE = 0.5;

const documentTokensByPath = () => {
  const manifest = readJson(manifestPath('documents'));
  return new Map(manifest.documents.map((document) => [document.path, document.tokens]));
};

const dedupeCapped = (items, cap) => {
  const unique = [...new Set(items)];
  return { items: unique.slice(0, cap), truncated: Math.max(0, unique.length - cap) };
};

const collectAmbiguities = ({ classification, modules, files }) => {
  const ambiguities = [];
  if (modules.length === 0 && files.length === 0) {
    ambiguities.push('no module matched — confirm the owner before editing');
  }
  if (classification.confidence < LOW_CONFIDENCE) {
    const runnersUp = classification.runnersUp.join(', ') || 'none';
    ambiguities.push(
      `classification confidence ${classification.confidence} — check runners-up: ${runnersUp}`,
    );
  }
  for (const file of files) {
    if (!fileExists(file)) {
      ambiguities.push(`provided file does not exist: ${file}`);
    }
  }
  return ambiguities;
};

const collectSource = ({ runtime, modules, files, symbolHits }) => {
  const moduleRoots = modules
    .map((module) => runtime.modules[module])
    .filter((record) => record !== undefined)
    .map((record) => record.root);
  return dedupeCapped(
    [...files, ...symbolHits.flatMap((hit) => hit.files), ...moduleRoots],
    MAX_SOURCE_FILES,
  );
};

const collectTests = ({ runtime, modules }) =>
  dedupeCapped(
    modules.flatMap((module) => runtime.tests.byModule?.[module] ?? []),
    MAX_TEST_FILES,
  );

export const selectContext = ({ runtime, classification, lane, taskText, files, symbolHits }) => {
  const taskType = runtime.taskTypes[classification.taskType];
  const tokensByDoc = documentTokensByPath();
  const modules = classification.modules ?? [];

  const docs = [...new Set([...(taskType.mustRead ?? []), ...(taskType.rules ?? [])])];
  const source = collectSource({ runtime, modules, files, symbolHits });
  const tests = collectTests({ runtime, modules });

  return {
    ambiguities: collectAmbiguities({ classification, modules, files }),
    docs,
    estimatedTokens: docs.reduce((sum, doc) => sum + (tokensByDoc.get(doc) ?? 0), 0),
    lane,
    modules,
    pack: `${AI_DIRS.packs}/${taskType.pack}.md`,
    reviewers: taskType.reviewers ?? [],
    skills: taskType.skills ?? [],
    source: source.items,
    sourceTruncated: source.truncated,
    symbols: symbolHits.map((hit) => hit.symbol),
    task: taskText,
    taskType: classification.taskType,
    tests: tests.items,
    testsTruncated: tests.truncated,
    validation: taskType.validation ?? [],
  };
};
