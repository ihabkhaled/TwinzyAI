/**
 * Quick-router compiler — renders `.ai/QUICK_ROUTER.md`: the one-screen
 * task-type → lane/pack/first-doc table agents scan before running the full
 * resolver. Budget-checked like every compiled artifact.
 */
import { runAsCli } from './lib/cli.mjs';
import { writeGeneratedMarkdown } from './lib/manifest-io.mjs';
import { AI_ROOT } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

const ROUTING = 'knowledge/routing-map.yaml';
const BUDGETS = 'knowledge/context-budget-policy.yaml';
const OUTPUT = `${AI_ROOT}/QUICK_ROUTER.md`;

export const buildQuickRouter = () => {
  const routingMap = loadYamlFile(ROUTING);
  const rows = Object.entries(routingMap.taskTypes).map(
    ([name, entry]) =>
      `| \`${name}\` | ${entry.lane} | \`.ai/packs/${entry.pack}.md\` | ${(entry.mustRead ?? [])[0] ?? '—'} |`,
  );
  const body = [
    '# Quick router — task type → lane, pack, first read',
    '',
    'Classify the task, open the pack, then run',
    '`npm run knowledge:context -- --task="<request>"` for the full resolved context.',
    '',
    '| Task type | Lane | Pack | First read |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');

  const budget = loadYamlFile(BUDGETS).artifacts.quickRouter.maxTokens;
  const tokens = estimateTokens(body);
  if (tokens > budget) {
    throw new Error(`quick router is ${tokens} tokens; budget is ${budget}`);
  }
  writeGeneratedMarkdown(OUTPUT, body, [ROUTING, BUDGETS]);
  return `${rows.length} task types (${tokens} tokens)`;
};

await runAsCli(import.meta.url, 'build-quick-router', () => buildQuickRouter());
