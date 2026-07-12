/**
 * Pack compiler — renders `.ai/packs/<id>.md` from `knowledge/packs.yaml`
 * (authored invariants/notes) joined with the routing-map entry for the same
 * task type (docs/rules/skills/reviewers/validation) and generated manifests
 * (code entrypoints from pathHints, tests from module ownership). Enforces
 * the pack token budget from context-budget-policy.yaml.
 */
import { runAsCli } from './lib/cli.mjs';
import { writeGeneratedMarkdown } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';
import { scanDocuments } from './scan-documents.mjs';
import { scanOwnership } from './scan-ownership.mjs';
import { scanSource } from './scan-source.mjs';
import { scanTests } from './scan-tests.mjs';

const MAX_LISTED_TESTS = 12;
const AUTHORED_INPUTS = [
  'knowledge/packs.yaml',
  'knowledge/routing-map.yaml',
  'knowledge/context-budget-policy.yaml',
];

const docLine = (path, documentsByPath) => {
  const document = documentsByPath.get(path);
  return document === undefined
    ? `- ${path}`
    : `- ${path} — ${document.summary} (~${document.tokens} tokens)`;
};

const modulesForHints = (hints, ownership) =>
  ownership.modules.filter((record) =>
    (hints ?? []).some((hint) => record.root.startsWith(hint.replace(/\/$/, ''))),
  );

const testsForModules = (moduleRecords, tests) => {
  const moduleIds = new Set(moduleRecords.map((record) => record.module));
  return tests.tests.filter((test) => moduleIds.has(test.module)).map((test) => test.path);
};

const listSection = (title, lines) => (lines.length === 0 ? [] : [`## ${title}`, '', ...lines, '']);

const renderPack = ({ pack, taskType, taskTypeName, documentsByPath, ownership, tests }) => {
  const moduleRecords = modulesForHints(taskType.pathHints, ownership);
  const testPaths = testsForModules(moduleRecords, tests);
  const truncatedTests = testPaths.slice(0, MAX_LISTED_TESTS);
  const lines = [
    `# Context pack: ${taskType.title}`,
    '',
    `Task type: \`${taskTypeName}\` · Lane: **${taskType.lane}** · Load after \`.ai/BOOTSTRAP.md\`.`,
    '',
    ...listSection(
      'Invariants for this area',
      (pack.invariants ?? []).map((invariant) => `- ${invariant}`),
    ),
    ...listSection(
      'Must-read docs',
      (taskType.mustRead ?? []).map((path) => docLine(path, documentsByPath)),
    ),
    ...listSection(
      'Rules',
      (taskType.rules ?? []).map((path) => docLine(path, documentsByPath)),
    ),
    ...listSection(
      'Skills',
      (taskType.skills ?? []).map((path) => `- ${path}`),
    ),
    ...listSection(
      'Reviewers',
      (taskType.reviewers ?? []).map((path) => `- ${path}`),
    ),
    ...listSection('Code entrypoints', [
      ...(taskType.pathHints ?? []).map((hint) => `- \`${hint}\``),
      ...moduleRecords.map(
        (record) =>
          `- module \`${record.module}\` at \`${record.root}\` (${record.fileCount} files)`,
      ),
    ]),
    ...listSection('Tests', [
      ...truncatedTests.map((path) => `- \`${path}\``),
      ...(testPaths.length > truncatedTests.length
        ? [`- …and ${testPaths.length - truncatedTests.length} more (see .ai/indexes/tests.json)`]
        : []),
    ]),
    ...listSection(
      'Validation before done',
      (taskType.validation ?? []).map((command) => `- \`${command}\``),
    ),
    ...(pack.notes === undefined ? [] : ['## Notes', '', pack.notes.trim(), '']),
  ];
  return lines.join('\n');
};

export const buildPacks = ({ repository = scanSource(), documents = scanDocuments() } = {}) => {
  const packsDefinition = loadYamlFile('knowledge/packs.yaml');
  const routingMap = loadYamlFile('knowledge/routing-map.yaml');
  const budgets = loadYamlFile('knowledge/context-budget-policy.yaml');
  const ownership = scanOwnership(repository);
  const tests = scanTests(repository);
  const documentsByPath = new Map(documents.documents.map((document) => [document.path, document]));

  const problems = [];
  for (const pack of packsDefinition.packs) {
    const taskType = routingMap.taskTypes[pack.taskType];
    if (taskType === undefined) {
      problems.push(`pack ${pack.id}: unknown taskType ${pack.taskType}`);
      continue;
    }
    const body = renderPack({
      pack,
      taskType,
      taskTypeName: pack.taskType,
      documentsByPath,
      ownership,
      tests,
    });
    const tokens = estimateTokens(body);
    const maxTokens =
      taskType.lane === 'critical'
        ? budgets.artifacts.pack.criticalLaneMaxTokens
        : budgets.artifacts.pack.maxTokens;
    if (tokens > maxTokens) {
      problems.push(`pack ${pack.id}: ${tokens} tokens exceeds budget ${maxTokens}`);
      continue;
    }
    writeGeneratedMarkdown(`${AI_DIRS.packs}/${pack.id}.md`, body, AUTHORED_INPUTS);
  }
  if (problems.length > 0) {
    throw new Error(problems.join('; '));
  }
  return `${packsDefinition.packs.length} packs compiled`;
};

await runAsCli(import.meta.url, 'build-packs', () => buildPacks());
