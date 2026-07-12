/**
 * Hash snapshot — writes `.ai/hashes/{source,document,pack}-hashes.json`, the
 * "state at last build" content hashes that `find-stale-items` and
 * `build-incremental` compare against. Hash triggers, never calendar age.
 */
import { runAsCli } from './lib/cli.mjs';
import { walkFiles } from './lib/fs-walk.mjs';
import { hashFile } from './lib/hashing.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { scanDocuments } from './scan-documents.mjs';
import { scanSource } from './scan-source.mjs';

export const writeHashSnapshots = ({
  repository = scanSource(),
  documents = scanDocuments(),
} = {}) => {
  const sourceHashes = {};
  for (const file of repository.files) {
    sourceHashes[file.path] = file.hash;
  }
  writeJson(`${AI_DIRS.hashes}/source-hashes.json`, sourceHashes);

  const documentHashes = {};
  for (const document of documents.documents) {
    documentHashes[document.path] = document.hash;
  }
  writeJson(`${AI_DIRS.hashes}/document-hashes.json`, documentHashes);

  const packHashes = {};
  const packPaths = walkFiles(AI_DIRS.packs, { extensions: ['.md'] });
  for (const packPath of packPaths) {
    packHashes[packPath] = hashFile(packPath);
  }
  writeJson(`${AI_DIRS.hashes}/pack-hashes.json`, packHashes);
  return `${repository.count} source + ${documents.count} document hashes`;
};

await runAsCli(import.meta.url, 'calculate-hashes', () => writeHashSnapshots());
