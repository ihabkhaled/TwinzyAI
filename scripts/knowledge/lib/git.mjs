/**
 * Minimal git access for the resolver: list files changed in a diff range.
 * The command is fixed (`git diff --name-only <range>`) and the range comes
 * from the operator's own CLI flag — never from user payloads.
 */
import { execFileSync } from 'node:child_process';

import { REPO_ROOT } from './paths.mjs';

export const changedFilesInDiff = (range) => {
  const output = execFileSync('git', ['diff', '--name-only', range], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .toSorted((a, b) => a.localeCompare(b));
};
