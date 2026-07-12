/**
 * Knowledge report — one human-readable summary of everything the analysis
 * passes found (stale items, contradictions, broken links, orphans,
 * duplicates, resolver performance). Read-only; never fails.
 */
import { runAsCli } from './lib/cli.mjs';
import { fileExists } from './lib/fs-walk.mjs';
import { generatedPath } from './lib/manifest-io.mjs';
import { readJson } from './lib/stable-json.mjs';

const load = (name) => (fileExists(generatedPath(name)) ? readJson(generatedPath(name)) : null);

const line = (label, value) => console.log(`  ${label.padEnd(34)} ${value ?? 'not analyzed'}`);

const printCounts = ({ stale, contradictions, links, orphans, duplicates, unresolved }) => {
  line('stale items', stale?.staleItems.length);
  line('contradiction check findings', contradictions?.checkFindings.length);
  line('open contradiction registry', contradictions?.registryOpen.length);
  const strictBroken = (links?.brokenLinks ?? []).filter((entry) => entry.strict);
  line('broken links (strict docs)', links === null ? null : strictBroken.length);
  line(
    'broken links (legacy docs)',
    links === null ? null : links.brokenLinks.length - strictBroken.length,
  );
  line('orphan candidates', orphans?.orphans.length);
  line(
    'duplicate id/title groups',
    duplicates === null
      ? null
      : `${duplicates.duplicateIds.length}/${duplicates.duplicateTitles.length}`,
  );
  line('unresolved references', unresolved?.unresolved.length);
};

const printDetails = ({ stale, contradictions }) => {
  const staleItems = stale?.staleItems ?? [];
  for (const item of staleItems) {
    console.log(`    stale: ${item.target} — ${item.reason}`);
  }
  const findings = contradictions?.checkFindings ?? [];
  for (const finding of findings) {
    console.log(`    contradiction: ${finding.checkId} @ ${finding.file}`);
  }
};

const main = () => {
  console.log('[knowledge] report');
  const loaded = {
    contradictions: load('contradictions'),
    duplicates: load('duplicate-topics'),
    links: load('broken-links'),
    orphans: load('orphans'),
    stale: load('stale-items'),
    unresolved: load('unresolved-references'),
  };
  printCounts(loaded);
  const performance = load('context-performance');
  line(
    'resolver p50/p95',
    performance === null ? 'not benchmarked' : `${performance.p50Ms}ms / ${performance.p95Ms}ms`,
  );
  printDetails(loaded);
  return 'see lines above';
};

await runAsCli(import.meta.url, 'report', () => main());
