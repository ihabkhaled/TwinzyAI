/**
 * Pack validator — every routing task type has a compiled pack, every pack
 * stays inside its token budget, and every pack carries the generated header.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists, readText } from './lib/fs-walk.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import { estimateTokens } from './lib/tokens.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';

export const validateContextPacks = () => {
  const routingMap = loadYamlFile('knowledge/routing-map.yaml');
  const budgets = loadYamlFile('knowledge/context-budget-policy.yaml');
  const errors = [];
  for (const [name, entry] of Object.entries(routingMap.taskTypes)) {
    const packPath = `${AI_DIRS.packs}/${entry.pack}.md`;
    if (!fileExists(packPath)) {
      errors.push(`task type ${name}: pack missing (${packPath}) — run knowledge:build`);
      continue;
    }
    const text = readText(packPath);
    if (!text.startsWith('<!-- GENERATED FILE')) {
      errors.push(`${packPath}: missing GENERATED header`);
    }
    const maxTokens =
      entry.lane === 'critical'
        ? budgets.artifacts.pack.criticalLaneMaxTokens
        : budgets.artifacts.pack.maxTokens;
    const tokens = estimateTokens(text);
    if (tokens > maxTokens) {
      errors.push(`${packPath}: ${tokens} tokens exceeds ${maxTokens}`);
    }
  }
  return errors;
};

await runAsCli(import.meta.url, 'validate-context-packs', () => {
  const errors = validateContextPacks();
  if (errors.length > 0) {
    throw new Error(`${errors.length} problem(s): ${errors.slice(0, 5).join(' | ')}`);
  }
  return 'all packs present and within budget';
});
