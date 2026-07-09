import {
  BENCHMARK_PERCENT_SCALE,
  type BenchmarkReport,
  type EntryMetrics,
  JSON_REPORT_INDENT,
} from './model/benchmark.types';

const percent = (value: number): string => `${Math.round(value * BENCHMARK_PERCENT_SCALE)}%`;

const entryRow = (entry: EntryMetrics): string =>
  `| ${entry.entryKey} | ${entry.samples} | ${percent(entry.schemaOkRate)} | ${percent(entry.safetyOkRate)} | ${percent(entry.failureRate)} | ${entry.p50Ms} | ${entry.p95Ms} | ${entry.score} |`;

/** Render the human-readable markdown report. */
export const toMarkdownReport = (report: BenchmarkReport): string => {
  const lines: string[] = [
    `# TwinzyAI AI Benchmark — ${report.mode.toUpperCase()} mode`,
    '',
    `- Started: ${report.startedAtIso}`,
    `- Samples per entry: ${report.samplesPerEntry}`,
    '',
    '## Caveats',
    '',
    ...report.caveats.map((caveat) => `- ${caveat}`),
  ];

  for (const step of report.steps) {
    lines.push('', `## Step: ${step.step}`, '');
    if (step.entries.length === 0) {
      lines.push(...step.notes.map((note) => `- ${note}`));
      continue;
    }
    lines.push(
      '| entry | samples | schemaOk | safetyOk | failures | p50 ms | p95 ms | score |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      ...step.entries.map((entry) => entryRow(entry)),
    );
    if (step.recommendation !== undefined) {
      lines.push('', `**Recommendation:** ${step.recommendation}`);
    }
    lines.push(...step.notes.map((note) => `- ${note}`));
  }

  lines.push(
    '',
    '## Applying a recommendation',
    '',
    'Set the step route explicitly, e.g. `AI_ROUTE_JUDGE=<winning entry>,<runner-up>` —',
    'never auto-apply benchmark output without reviewing safety + cost first.',
    '',
  );
  return lines.join('\n');
};

/** Render the machine-readable summary. */
export const toJsonReport = (report: BenchmarkReport): string =>
  JSON.stringify(report, null, JSON_REPORT_INDENT);
