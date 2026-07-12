/**
 * Frontmatter validator — documents in the knowledge-OS canonical areas MUST
 * carry complete frontmatter (progressive adoption: legacy areas only report
 * a count). Duplicate ids across the frontmattered corpus are hard errors.
 */
import { runAsCli } from './lib/cli.mjs';
import { scanDocuments } from './scan-documents.mjs';

const REQUIRED_DIRS = [
  'structure/',
  'product/',
  'domain/',
  'contracts/',
  'operations/',
  'incidents/',
  'quality/',
  'knowledge/',
  'docs/ai/',
];

const FIELD_CHECKS = [
  ['id', (document) => document.id !== ''],
  ['title', (document) => document.title !== ''],
  ['summary', (document) => document.summary !== ''],
  ['keywords', (document) => document.keywords.length > 0],
];

const missingFields = (document) =>
  FIELD_CHECKS.filter(([, hasField]) => !hasField(document)).map(([field]) => field);

const checkDocument = ({ document, errors, seenIds }) => {
  for (const field of missingFields(document)) {
    errors.push(`${document.path}: frontmatter missing usable "${field}"`);
  }
  const previous = seenIds.get(document.id);
  if (previous !== undefined) {
    errors.push(`duplicate document id "${document.id}": ${previous} and ${document.path}`);
  }
  seenIds.set(document.id, document.path);
};

export const validateFrontmatter = (documents = scanDocuments()) => {
  const errors = [];
  const seenIds = new Map();
  let legacyWithout = 0;
  for (const document of documents.documents) {
    if (document.path.startsWith('knowledge/templates/')) {
      continue;
    }
    if (document.hasFrontmatter) {
      checkDocument({ document, errors, seenIds });
    } else if (REQUIRED_DIRS.some((dir) => document.path.startsWith(dir))) {
      errors.push(`${document.path}: missing frontmatter (required in this area)`);
    } else {
      legacyWithout += 1;
    }
  }
  return { errors, legacyWithout };
};

await runAsCli(import.meta.url, 'validate-frontmatter', () => {
  const { errors, legacyWithout } = validateFrontmatter();
  if (errors.length > 0) {
    throw new Error(`${errors.length} error(s): ${errors.slice(0, 5).join(' | ')}`);
  }
  return `ok (${legacyWithout} legacy docs pending frontmatter adoption)`;
});
