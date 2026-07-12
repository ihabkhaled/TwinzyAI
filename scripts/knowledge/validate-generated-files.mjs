/**
 * Generated-file validator — proves the committed `.ai/` plane matches its
 * inputs: every generated-from record's input hashes must match reality
 * (drift ⇒ someone changed sources without `knowledge:build`, or edited
 * `.ai/` by hand), every recorded output must exist, and every Markdown
 * artifact under `.ai/` must carry the GENERATED header.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText, walkFiles } from './lib/fs-walk.mjs';
import { combineHashes, hashFiles } from './lib/hashing.mjs';
import { readGeneratedFrom } from './lib/manifest-io.mjs';
import { AI_ROOT } from './lib/paths.mjs';

const GENERATED_HEADER = '<!-- GENERATED FILE';

export const validateGeneratedFiles = () => {
  const errors = [];
  const registry = readGeneratedFrom();
  for (const [output, record] of Object.entries(registry)) {
    if (!fileExists(output)) {
      errors.push(`${output}: recorded but missing — run knowledge:build`);
      continue;
    }
    const missing = record.inputs.filter((input) => !fileExists(input));
    if (missing.length > 0) {
      errors.push(`${output}: input(s) deleted (${missing.join(', ')}) — rebuild or retire`);
      continue;
    }
    if (combineHashes(hashFiles(record.inputs)) !== record.inputsHash) {
      errors.push(`${output}: inputs changed since last build — run knowledge:build`);
    }
  }
  const aiMarkdownFiles = walkFiles(AI_ROOT, { extensions: ['.md'] });
  for (const path of aiMarkdownFiles) {
    if (path.startsWith(`${AI_ROOT}/local/`)) {
      continue;
    }
    if (!readText(path).startsWith(GENERATED_HEADER)) {
      errors.push(`${path}: missing GENERATED header — never hand-author files under .ai/`);
    }
  }
  return errors;
};

await runAsCli(import.meta.url, 'validate-generated-files', () => {
  const errors = validateGeneratedFiles();
  if (errors.length > 0) {
    throw new Error(`${errors.length} problem(s): ${errors.slice(0, 5).join(' | ')}`);
  }
  return 'generated plane matches its inputs';
});
