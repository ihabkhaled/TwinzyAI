/**
 * Read/write helpers for the generated `.ai/` acceleration plane.
 *
 * Every writer records its canonical inputs into
 * `.ai/hashes/generated-from.json` so staleness can be detected by comparing
 * input hashes — never by calendar age or manual bookkeeping.
 */
import { fileExists, writeText } from './fs-walk.mjs';
import { combineHashes, hashFiles } from './hashing.mjs';
import { AI_DIRS } from './paths.mjs';
import { readJson, writeJson } from './stable-json.mjs';

const GENERATED_FROM_PATH = `${AI_DIRS.hashes}/generated-from.json`;

export const manifestPath = (name) => `${AI_DIRS.manifests}/${name}.json`;

export const indexPath = (name) => `${AI_DIRS.indexes}/${name}.json`;

export const graphPath = (name) => `${AI_DIRS.graphs}/${name}.json`;

export const generatedPath = (name) => `${AI_DIRS.generated}/${name}.json`;

export const readGeneratedFrom = () =>
  fileExists(GENERATED_FROM_PATH) ? readJson(GENERATED_FROM_PATH) : {};

/** Record the canonical inputs (and their combined hash) behind one generated file. */
export const recordGeneratedFrom = (outputRelPath, inputRelPaths) => {
  const registry = readGeneratedFrom();
  const inputs = [...inputRelPaths].toSorted((a, b) => a.localeCompare(b));
  registry[outputRelPath] = { inputs, inputsHash: combineHashes(hashFiles(inputs)) };
  writeJson(GENERATED_FROM_PATH, registry);
};

/** Write a generated JSON artifact and register its inputs in one step. */
export const writeGeneratedJson = (outputRelPath, value, inputRelPaths) => {
  writeJson(outputRelPath, value);
  recordGeneratedFrom(outputRelPath, inputRelPaths);
};

/** Write a generated Markdown artifact (with a machine-readable header) and register inputs. */
export const writeGeneratedMarkdown = (outputRelPath, body, inputRelPaths) => {
  const inputs = [...inputRelPaths].toSorted((a, b) => a.localeCompare(b));
  const header = [
    '<!-- GENERATED FILE — do not edit by hand.',
    `     Rebuild: npm run knowledge:build`,
    `     Sources: ${inputs.join(', ')} -->`,
    '',
  ].join('\n');
  writeText(outputRelPath, `${header}\n${body}`);
  recordGeneratedFrom(outputRelPath, inputs);
};
