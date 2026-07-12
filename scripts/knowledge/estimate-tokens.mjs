/**
 * Token estimator CLI — the shared ~4 chars/token heuristic over one or more
 * files, for authors checking budgets before a build:
 *
 *   node scripts/knowledge/estimate-tokens.mjs knowledge/bootstrap.md ...
 */
import process from 'node:process';

import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText } from './lib/fs-walk.mjs';
import { estimateTokens } from './lib/tokens.mjs';

const main = () => {
  const paths = process.argv.slice(2).filter((argument) => !argument.startsWith('-'));
  if (paths.length === 0) {
    throw new Error('usage: estimate-tokens <file> [<file> ...]');
  }
  let total = 0;
  for (const path of paths) {
    if (!fileExists(path)) {
      console.log(`${path}: MISSING`);
      continue;
    }
    const tokens = estimateTokens(readText(path));
    total += tokens;
    console.log(`${path}: ~${tokens} tokens`);
  }
  return `total ~${total} tokens across ${paths.length} file(s)`;
};

await runAsCli(import.meta.url, 'estimate-tokens', () => main());
