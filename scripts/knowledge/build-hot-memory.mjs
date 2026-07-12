/**
 * Hot-memory compiler — renders `.ai/HOT_MEMORY.md` from the authored
 * `knowledge/hot-memory.md` under a hard token budget. Hot memory holds only
 * currently active, high-impact facts; resolved facts are removed from the
 * source (history stays in `memory/`).
 */
import { runAsCli } from './lib/cli.mjs';
import { readText } from './lib/fs-walk.mjs';
import { writeGeneratedMarkdown } from './lib/manifest-io.mjs';
import { splitFrontmatter } from './lib/markdown.mjs';
import { AI_ROOT } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

const SOURCE = 'knowledge/hot-memory.md';
const BUDGETS = 'knowledge/context-budget-policy.yaml';
const OUTPUT = `${AI_ROOT}/HOT_MEMORY.md`;

export const buildHotMemory = () => {
  const { body } = splitFrontmatter(readText(SOURCE));
  const budget = loadYamlFile(BUDGETS).artifacts.hotMemory.maxTokens;
  const tokens = estimateTokens(body);
  if (tokens > budget) {
    throw new Error(`hot memory is ${tokens} tokens; budget is ${budget}`);
  }
  writeGeneratedMarkdown(OUTPUT, body, [SOURCE, BUDGETS]);
  return `${tokens} tokens (budget ${budget})`;
};

await runAsCli(import.meta.url, 'build-hot-memory', () => buildHotMemory());
