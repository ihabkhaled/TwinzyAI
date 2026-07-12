/**
 * Prompt scanner — builds `.ai/manifests/prompts.json`: every AI prompt asset
 * (template files and prompt-building source) in the AI module, so prompt
 * changes route to the prompt-governance pack and safety review.
 */
import { runAsCli } from './lib/cli.mjs';
import { walkFiles } from './lib/fs-walk.mjs';
import { writeGeneratedJson } from './lib/manifest-io.mjs';
import { AI_DIRS } from './lib/paths.mjs';

const AI_MODULE_ROOT = 'apps/api/src/modules/ai';

const isPromptAsset = (path) => {
  const basename = path.slice(path.lastIndexOf('/') + 1).toLowerCase();
  return basename.includes('prompt') && !basename.includes('.test.');
};

const kindOf = (path) => {
  if (path.endsWith('.md') || path.endsWith('.txt')) {
    return 'prompt-template';
  }
  return path.includes('/infrastructure/') ? 'prompt-infrastructure' : 'prompt-source';
};

export const scanPrompts = () => {
  const prompts = walkFiles(AI_MODULE_ROOT)
    .filter((path) => isPromptAsset(path))
    .map((path) => ({
      kind: kindOf(path),
      name: path.slice(path.lastIndexOf('/') + 1),
      path,
    }));
  return { count: prompts.length, prompts };
};

export const writePromptsManifest = () => {
  const manifest = scanPrompts();
  writeGeneratedJson(
    `${AI_DIRS.manifests}/prompts.json`,
    manifest,
    manifest.prompts.map((prompt) => prompt.path),
  );
  return `${manifest.count} prompt assets`;
};

await runAsCli(import.meta.url, 'scan-prompts', () => writePromptsManifest());
