/**
 * Renders the resolved context as the Markdown brief an agent actually reads
 * (`.ai/local/current-context.md`).
 */
const section = (title, lines) => (lines.length === 0 ? [] : [`## ${title}`, '', ...lines, '']);

export const renderContextMarkdown = (context, elapsedMs) => {
  const lines = [
    '# Resolved task context',
    '',
    `Task: ${context.task}`,
    '',
    `Type: \`${context.taskType}\` · Lane: **${context.lane}** · Confidence: ${context.confidence}`,
    `Resolved in ${elapsedMs.toFixed(0)}ms · Estimated mandatory-doc tokens: ~${context.estimatedTokens}`,
    '',
    ...section('Read order', [
      '1. `.ai/BOOTSTRAP.md` (if not already loaded)',
      `2. \`${context.pack}\``,
      '3. The source and tests below (read in parallel)',
      '4. Must-read docs as needed',
    ]),
    ...section(
      'Ambiguities — resolve before implementing',
      context.ambiguities.map((item) => `- ⚠ ${item}`),
    ),
    ...section(
      'Modules',
      context.modules.map((module) => `- \`${module}\``),
    ),
    ...section(
      'Symbols matched',
      context.symbols.map((symbol) => `- \`${symbol}\``),
    ),
    ...section('Source', [
      ...context.source.map((path) => `- \`${path}\``),
      ...(context.sourceTruncated > 0 ? [`- …${context.sourceTruncated} more (capped)`] : []),
    ]),
    ...section('Tests', [
      ...context.tests.map((path) => `- \`${path}\``),
      ...(context.testsTruncated > 0 ? [`- …${context.testsTruncated} more (capped)`] : []),
    ]),
    ...section(
      'Must-read docs',
      context.docs.map((path) => `- ${path}`),
    ),
    ...section(
      'Skills',
      context.skills.map((path) => `- ${path}`),
    ),
    ...section(
      'Reviewers',
      context.reviewers.map((path) => `- ${path}`),
    ),
    ...section(
      'Validation before done',
      context.validation.map((command) => `- \`${command}\``),
    ),
  ];
  return lines.join('\n');
};
