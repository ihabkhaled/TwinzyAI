/**
 * Content hashing for freshness detection.
 *
 * SHA-256 over the LF-normalized file text so hashes are identical whether the
 * checkout uses LF or CRLF line endings.
 */
import { createHash } from 'node:crypto';

import { readText } from './fs-walk.mjs';

export const sha256Text = (text) =>
  createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');

export const hashFile = (relPath) => sha256Text(readText(relPath));

/** Hash a sorted list of repo-relative files into `{ path: hash }`. */
export const hashFiles = (relPaths) => {
  const result = {};
  const sortedPaths = [...relPaths].toSorted((a, b) => a.localeCompare(b));
  for (const relPath of sortedPaths) {
    result[relPath] = hashFile(relPath);
  }
  return result;
};

/** One combined hash over many `{ path: hash }` entries, order-independent. */
export const combineHashes = (hashByPath) => {
  const combined = createHash('sha256');
  const sortedKeys = Object.keys(hashByPath).toSorted((a, b) => a.localeCompare(b));
  for (const key of sortedKeys) {
    combined.update(`${key}:${hashByPath[key]}\n`);
  }
  return combined.digest('hex');
};
