/**
 * Link validator — every relative Markdown link must resolve to a real file
 * or directory. Broken links FAIL for documents with frontmatter (the
 * migrated corpus) and for everything under knowledge/; legacy documents are
 * reported but do not fail, so adoption stays incremental.
 */
import { existsSync } from 'node:fs';

import { runAsCli } from './lib/cli.mjs';
import { generatedPath, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { fromRepo, parentDir } from './lib/paths.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { scanDocuments } from './scan-documents.mjs';

const resolveCandidates = (docPath, target) => {
  if (target.startsWith('/')) {
    return [target.slice(1)];
  }
  const relative = [];
  const base = `${parentDir(docPath)}/${target}`;
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
  relative.push(segments.join('/'), target);
  return relative;
};

const isStrict = (document) => document.hasFrontmatter || document.path.startsWith('knowledge/');

export const validateLinks = (documents = scanDocuments()) => {
  const brokenLinks = [];
  for (const document of documents.documents) {
    // Templates are skeletons whose links target their DEPLOYED location
    // (e.g. knowledge/templates/ai-readme.md compiles into .ai/README.md).
    if (document.path.startsWith('knowledge/templates/')) {
      continue;
    }
    for (const target of document.links) {
      const resolved = resolveCandidates(document.path, target).some((candidate) =>
        existsSync(fromRepo(candidate)),
      );
      if (!resolved) {
        brokenLinks.push({ doc: document.path, strict: isStrict(document), target });
      }
    }
  }
  const sorted = brokenLinks.toSorted(
    (a, b) => a.doc.localeCompare(b.doc) || a.target.localeCompare(b.target),
  );
  const output = generatedPath('broken-links');
  writeJson(output, { brokenLinks: sorted });
  recordGeneratedFrom(output, ['knowledge/routing-map.yaml']);
  return sorted;
};

await runAsCli(import.meta.url, 'validate-links', () => {
  const brokenLinks = validateLinks();
  const strictFailures = brokenLinks.filter((link) => link.strict);
  if (strictFailures.length > 0) {
    throw new Error(
      `${strictFailures.length} broken link(s) in strict docs, e.g. ${strictFailures[0].doc} → ${strictFailures[0].target}`,
    );
  }
  return `${brokenLinks.length} broken (0 in strict docs)`;
});
