/**
 * Summary compiler — copies the authored digests in `knowledge/summaries/`
 * into `.ai/summaries/` (frontmatter stripped, generated header added) under
 * the per-summary token budget. Summaries are compiled views: their facts
 * must live in the canonical docs they cite.
 */
import { runAsCli } from './lib/cli.mjs';
import { readText, walkFiles } from './lib/fs-walk.mjs';
import { writeGeneratedMarkdown } from './lib/manifest-io.mjs';
import { splitFrontmatter } from './lib/markdown.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

const SOURCE_DIR = 'knowledge/summaries';
const BUDGETS = 'knowledge/context-budget-policy.yaml';

export const buildSummaries = () => {
  const budget = loadYamlFile(BUDGETS).artifacts.summary.maxTokens;
  const sources = walkFiles(SOURCE_DIR, { extensions: ['.md'] });
  const problems = [];
  for (const source of sources) {
    const { body } = splitFrontmatter(readText(source));
    const tokens = estimateTokens(body);
    if (tokens > budget) {
      problems.push(`${source}: ${tokens} tokens exceeds budget ${budget}`);
      continue;
    }
    const name = source.slice(source.lastIndexOf('/') + 1);
    writeGeneratedMarkdown(`${AI_DIRS.summaries}/${name}`, body.trim(), [source, BUDGETS]);
  }
  if (problems.length > 0) {
    throw new Error(problems.join('; '));
  }
  return `${sources.length} summaries compiled`;
};

await runAsCli(import.meta.url, 'build-summaries', () => buildSummaries());
