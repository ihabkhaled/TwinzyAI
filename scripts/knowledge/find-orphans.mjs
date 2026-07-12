/**
 * Orphan detector — canonical documents unreachable from routing: not linked
 * by any other document, not referenced by the routing map or packs. Orphans
 * are merge/retire candidates, not automatic errors (historical dirs are
 * exempt because they are reached through their folder, not links).
 */
import { runAsCli } from './lib/cli.mjs';
import { readText } from './lib/fs-walk.mjs';
import { generatedPath, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { parentDir } from './lib/paths.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { scanDocuments } from './scan-documents.mjs';

const EXEMPT_PREFIXES = [
  'docs/features/',
  'release-notes/',
  'test-cases/',
  'incidents/',
  'memory/',
  'architecture/adrs/',
  '.cursor/',
];
const EXEMPT_BASENAMES = new Set(['README.md']);

const normalizeTarget = (docPath, target) => {
  const base = target.startsWith('/') ? target.slice(1) : `${parentDir(docPath)}/${target}`;
  const segments = [];
  for (const segment of base.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
    } else {
      segments.push(segment);
    }
  }
  return segments.join('/');
};

export const findOrphans = (documents = scanDocuments()) => {
  const referenced = new Set();
  for (const document of documents.documents) {
    for (const link of [...document.links, ...document.relatedDocs]) {
      referenced.add(normalizeTarget(document.path, link));
    }
  }
  const routingText = `${readText('knowledge/routing-map.yaml')}\n${readText('knowledge/packs.yaml')}`;
  const orphans = documents.documents
    .filter((document) => {
      const basename = document.path.slice(document.path.lastIndexOf('/') + 1);
      return (
        !referenced.has(document.path) &&
        !routingText.includes(document.path) &&
        EXEMPT_PREFIXES.every((prefix) => !document.path.startsWith(prefix)) &&
        !EXEMPT_BASENAMES.has(basename) &&
        document.path.includes('/')
      );
    })
    .map((document) => document.path);
  const output = generatedPath('orphans');
  writeJson(output, { orphans });
  recordGeneratedFrom(output, ['knowledge/routing-map.yaml', 'knowledge/packs.yaml']);
  return orphans;
};

await runAsCli(import.meta.url, 'find-orphans', () => {
  const orphans = findOrphans();
  return `${orphans.length} orphan candidate(s)`;
});
