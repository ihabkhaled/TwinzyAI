/**
 * Bootstrap compiler — renders `.ai/BOOTSTRAP.md` from the authored
 * `knowledge/bootstrap.md`, injecting open critical contradictions from
 * `knowledge/contradiction-checks.yaml` at the `{{CRITICAL_CONTRADICTIONS}}`
 * placeholder. The ~1,500-token budget is HARD: the build fails when the
 * compiled bootstrap exceeds it.
 */
import { runAsCli } from './lib/cli.mjs';
import { readText } from './lib/fs-walk.mjs';
import { writeGeneratedMarkdown } from './lib/manifest-io.mjs';
import { splitFrontmatter } from './lib/markdown.mjs';
import { AI_ROOT } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

const SOURCE = 'knowledge/bootstrap.md';
const CHECKS = 'knowledge/contradiction-checks.yaml';
const BUDGETS = 'knowledge/context-budget-policy.yaml';
const PLACEHOLDER = '{{CRITICAL_CONTRADICTIONS}}';
const OUTPUT = `${AI_ROOT}/BOOTSTRAP.md`;

const firstSentence = (text) => {
  const flattened = text.replaceAll(/\s+/g, ' ').trim();
  const period = flattened.indexOf('. ');
  return period === -1 ? flattened : flattened.slice(0, period + 1);
};

export const buildBootstrap = () => {
  const checks = loadYamlFile(CHECKS);
  const openCritical = (checks.registry ?? []).filter(
    (entry) => entry.status === 'open' && entry.severity === 'critical',
  );
  const bullets =
    openCritical.length === 0
      ? '- None open.'
      : openCritical
          .map((entry) => `- **${entry.id}** — ${firstSentence(entry.statement)}`)
          .join('\n');
  const body = splitFrontmatter(readText(SOURCE)).body.replace(PLACEHOLDER, () => bullets);
  if (body.includes(PLACEHOLDER)) {
    throw new Error(`placeholder ${PLACEHOLDER} not resolved`);
  }

  const budget = loadYamlFile(BUDGETS).artifacts.bootstrap.maxTokens;
  const tokens = estimateTokens(body);
  if (tokens > budget) {
    throw new Error(`bootstrap is ${tokens} tokens; budget is ${budget}`);
  }
  writeGeneratedMarkdown(OUTPUT, body, [SOURCE, CHECKS, BUDGETS]);
  return `${tokens} tokens (budget ${budget}), ${openCritical.length} critical items`;
};

await runAsCli(import.meta.url, 'build-bootstrap', () => buildBootstrap());
