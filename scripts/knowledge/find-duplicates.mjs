/**
 * Duplicate detector — duplicate document ids (hard error at validate time)
 * and duplicate normalized titles among frontmattered docs (candidates for
 * merging; the same topic must not have two owners).
 */
import { runAsCli } from './lib/cli.mjs';
import { generatedPath, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { scanDocuments } from './scan-documents.mjs';

const groupBy = (items, keyOf) => {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (key === null) {
      continue;
    }
    groups.set(key, [...(groups.get(key) ?? []), item.path]);
  }
  return [...groups]
    .filter(([, paths]) => paths.length > 1)
    .map(([key, paths]) => ({ key, paths: paths.toSorted((a, b) => a.localeCompare(b)) }))
    .toSorted((a, b) => a.key.localeCompare(b.key));
};

export const findDuplicates = (documents = scanDocuments()) => {
  const frontmattered = documents.documents.filter((document) => document.hasFrontmatter);
  const duplicateIds = groupBy(frontmattered, (document) => document.id);
  const duplicateTitles = groupBy(frontmattered, (document) =>
    document.title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, ' ')
      .trim(),
  );
  const output = generatedPath('duplicate-topics');
  writeJson(output, { duplicateIds, duplicateTitles });
  recordGeneratedFrom(
    output,
    frontmattered.map((document) => document.path),
  );
  return { duplicateIds, duplicateTitles };
};

await runAsCli(import.meta.url, 'find-duplicates', () => {
  const { duplicateIds, duplicateTitles } = findDuplicates();
  return `${duplicateIds.length} duplicate id group(s), ${duplicateTitles.length} duplicate title group(s)`;
});
