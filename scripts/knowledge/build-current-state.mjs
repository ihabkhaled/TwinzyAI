/**
 * Current-state compiler — renders `.ai/CURRENT_STATE.md`: the repo shape at
 * last build (module/route/test/doc counts, active feature folders, open
 * findings). Derived only from repo contents so the output is deterministic.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists, walkFiles } from './lib/fs-walk.mjs';
import { writeGeneratedMarkdown } from './lib/manifest-io.mjs';
import { AI_ROOT } from './lib/paths.mjs';
import { readJson } from './lib/stable-json.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';
import { scanDocuments } from './scan-documents.mjs';
import { scanRoutes } from './scan-routes.mjs';
import { scanSource } from './scan-source.mjs';
import { scanTests } from './scan-tests.mjs';

const OUTPUT = `${AI_ROOT}/CURRENT_STATE.md`;

const featureFolders = () => {
  const folders = new Set();
  const featureDocs = walkFiles('docs/features', { extensions: ['.md'] });
  for (const path of featureDocs) {
    const parts = path.split('/');
    if (parts.length > 3 && !parts[2].startsWith('_')) {
      folders.add(parts[2]);
    }
  }
  return [...folders].toSorted((a, b) => a.localeCompare(b));
};

const openFindings = (relPath, key) => {
  const fullPath = `${AI_ROOT}/generated/${relPath}`;
  if (!fileExists(fullPath)) {
    return 'not yet generated';
  }
  const data = readJson(fullPath);
  const items = data[key];
  return Array.isArray(items) ? String(items.length) : 'unknown';
};

export const buildCurrentState = ({
  repository = scanSource(),
  documents = scanDocuments(),
} = {}) => {
  const routes = scanRoutes(repository);
  const tests = scanTests(repository);
  const checks = loadYamlFile('knowledge/contradiction-checks.yaml');
  const openRegistry = (checks.registry ?? []).filter((entry) => entry.status === 'open');
  const modules = new Set(repository.files.map((file) => file.module));

  const body = [
    '# Current repository state (at last knowledge build)',
    '',
    '| Fact | Value |',
    '| --- | --- |',
    `| Source files scanned | ${repository.count} |`,
    `| Source modules | ${modules.size} |`,
    `| API endpoints | ${routes.apiCount} |`,
    `| Web routes | ${routes.webCount} |`,
    `| Test files | ${tests.count} |`,
    `| Canonical documents | ${documents.count} |`,
    `| Open contradiction-registry entries | ${openRegistry.length} |`,
    `| Stale items at last analysis | ${openFindings('stale-items.json', 'staleItems')} |`,
    `| Broken links at last analysis | ${openFindings('broken-links.json', 'brokenLinks')} |`,
    '',
    '## Active feature folders (docs/features/)',
    '',
    ...featureFolders().map((folder) => `- ${folder}`),
    '',
    '## Open contradiction-registry entries',
    '',
    ...(openRegistry.length === 0
      ? ['- None.']
      : openRegistry.map(
          (entry) =>
            `- **${entry.id}** (${entry.severity}) — see knowledge/contradiction-checks.yaml`,
        )),
  ].join('\n');

  writeGeneratedMarkdown(OUTPUT, body, ['knowledge/contradiction-checks.yaml']);
  return `${modules.size} modules, ${documents.count} documents`;
};

await runAsCli(import.meta.url, 'build-current-state', () => buildCurrentState());
