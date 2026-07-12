/**
 * Deterministic JSON serialization for generated artifacts.
 *
 * Object keys are sorted recursively; array order is preserved (producers sort
 * arrays themselves where order is not meaningful). Output always ends with a
 * newline so files are byte-stable and diff-friendly.
 */
import { readText, writeText } from './fs-walk.mjs';

const sortValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sortValue(item));
  }
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    const sortedKeys = Object.keys(value).toSorted((a, b) => a.localeCompare(b));
    for (const key of sortedKeys) {
      sorted[key] = sortValue(value[key]);
    }
    return sorted;
  }
  return value;
};

const stableStringify = (value) => `${JSON.stringify(sortValue(value), undefined, 2)}\n`;

export const writeJson = (relPath, value) => {
  writeText(relPath, stableStringify(value));
};

export const readJson = (relPath) => JSON.parse(readText(relPath));
