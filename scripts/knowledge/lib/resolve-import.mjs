/**
 * Resolve relative TypeScript import specifiers against the scanned file set.
 * Used to connect tests to the code under test and modules to each other.
 */
import { parentDir } from './paths.mjs';

const normalizeSegments = (path) => {
  const output = [];
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      output.pop();
    } else {
      output.push(segment);
    }
  }
  return output.join('/');
};

const CANDIDATE_SUFFIXES = ['.ts', '.tsx', '/index.ts', '/index.tsx', ''];

/**
 * Resolve a relative import from `fromPath` to a repo-relative file path.
 *
 * @param {string} fromPath Repo-relative importer path.
 * @param {string} specifier Import specifier (only `./`/`../` specifiers resolve).
 * @param {Set<string>} knownPaths All scanned repo-relative source paths.
 * @returns {string | null} The imported file's path, or null when unresolvable.
 */
export const resolveRelativeImport = (fromPath, specifier, knownPaths) => {
  if (!specifier.startsWith('.')) {
    return null;
  }
  const joined = normalizeSegments(`${parentDir(fromPath)}/${specifier}`);
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${joined}${suffix}`;
    if (knownPaths.has(candidate)) {
      return candidate;
    }
  }
  return null;
};
