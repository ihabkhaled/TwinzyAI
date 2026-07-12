/**
 * Deterministic filesystem access for the knowledge compiler.
 *
 * All walks return sorted, repo-relative, POSIX-style paths so every generated
 * artifact is byte-identical regardless of platform or directory enumeration
 * order. Writes always use LF line endings.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { fromRepo, toPosix } from './paths.mjs';

const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.next',
  'coverage',
  '.git',
  'playwright-report',
  'test-results',
  '.migration-wip',
  'out',
  'build',
]);

const isExcludedDir = (name) => EXCLUDED_DIR_NAMES.has(name);

const hasWantedExtension = (name, extensions) =>
  extensions === undefined || extensions.some((extension) => name.endsWith(extension));

const collectFiles = (absDir, relDir, extensions, sink) => {
  const entries = readdirSync(absDir, { withFileTypes: true }).toSorted((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const absChild = path.join(absDir, entry.name);
    const relChild = relDir === '' ? entry.name : `${relDir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!isExcludedDir(entry.name)) {
        collectFiles(absChild, relChild, extensions, sink);
      }
    } else if (entry.isFile() && hasWantedExtension(entry.name, extensions)) {
      sink.push(relChild);
    }
  }
};

/**
 * Recursively list files under a repo-relative root.
 *
 * @param {string} relRoot Repo-relative directory to walk.
 * @param {{ extensions?: string[] }} [options] Optional extension filter (e.g. `['.md']`).
 * @returns {string[]} Sorted repo-relative POSIX paths. Empty when the root is missing.
 */
export const walkFiles = (relRoot, options = {}) => {
  const absRoot = fromRepo(relRoot);
  if (!existsSync(absRoot) || !statSync(absRoot).isDirectory()) {
    return [];
  }
  const sink = [];
  collectFiles(absRoot, toPosix(relRoot), options.extensions, sink);
  return sink.toSorted((a, b) => a.localeCompare(b));
};

export const fileExists = (relPath) => existsSync(fromRepo(relPath));

export const readText = (relPath) => readFileSync(fromRepo(relPath), 'utf8');

export const writeText = (relPath, content) => {
  const absPath = fromRepo(relPath);
  mkdirSync(path.dirname(absPath), { recursive: true });
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  writeFileSync(absPath, normalized.replaceAll('\r\n', '\n'), 'utf8');
};
