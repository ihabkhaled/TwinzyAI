/**
 * Source-reference validator — every path a routing definition or a
 * frontmattered document claims (relatedCode, relatedTests, relatedDocs,
 * routing-map docs/rules/skills/reviewers, pack task types) must exist.
 * Unresolved references break routing, so they fail hard.
 */
import { existsSync } from 'node:fs';

import { runAsCli } from './lib/cli.mjs';
import { generatedPath, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { fromRepo } from './lib/paths.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';
import { scanDocuments } from './scan-documents.mjs';

const checkPaths = (owner, paths, unresolved) => {
  for (const path of paths) {
    if (!existsSync(fromRepo(path))) {
      unresolved.push({ owner, path });
    }
  }
};

const checkRoutingMap = (unresolved) => {
  const routingMap = loadYamlFile('knowledge/routing-map.yaml');
  for (const [name, entry] of Object.entries(routingMap.taskTypes)) {
    const owner = `knowledge/routing-map.yaml#${name}`;
    checkPaths(owner, entry.mustRead ?? [], unresolved);
    checkPaths(owner, entry.rules ?? [], unresolved);
    checkPaths(owner, entry.skills ?? [], unresolved);
    checkPaths(owner, entry.reviewers ?? [], unresolved);
  }
  return routingMap;
};

const checkPacks = (routingMap, unresolved) => {
  const packs = loadYamlFile('knowledge/packs.yaml');
  const packTaskTypes = new Set(packs.packs.map((pack) => pack.taskType));
  for (const pack of packs.packs) {
    if (routingMap.taskTypes[pack.taskType] === undefined) {
      unresolved.push({
        owner: `knowledge/packs.yaml#${pack.id}`,
        path: `taskType:${pack.taskType}`,
      });
    }
  }
  for (const name of Object.keys(routingMap.taskTypes)) {
    if (!packTaskTypes.has(name)) {
      unresolved.push({ owner: 'knowledge/packs.yaml', path: `missing pack for taskType:${name}` });
    }
  }
};

const checkDocuments = (documents, unresolved) => {
  for (const document of documents.documents) {
    // Templates carry placeholder frontmatter, not live references.
    if (!document.hasFrontmatter || document.path.startsWith('knowledge/templates/')) {
      continue;
    }
    checkPaths(document.path, document.relatedCode, unresolved);
    checkPaths(document.path, document.relatedTests, unresolved);
    checkPaths(document.path, document.relatedDocs, unresolved);
  }
};

export const validateSourceReferences = (documents = scanDocuments()) => {
  const unresolved = [];
  const routingMap = checkRoutingMap(unresolved);
  checkPacks(routingMap, unresolved);
  checkDocuments(documents, unresolved);
  const sorted = unresolved.toSorted(
    (a, b) => a.owner.localeCompare(b.owner) || a.path.localeCompare(b.path),
  );
  const output = generatedPath('unresolved-references');
  writeJson(output, { unresolved: sorted });
  recordGeneratedFrom(output, ['knowledge/routing-map.yaml', 'knowledge/packs.yaml']);
  return unresolved;
};

await runAsCli(import.meta.url, 'validate-source-references', () => {
  const unresolved = validateSourceReferences();
  if (unresolved.length > 0) {
    throw new Error(
      `${unresolved.length} unresolved reference(s), e.g. ${unresolved[0].owner} → ${unresolved[0].path}`,
    );
  }
  return 'all references resolve';
});
