/**
 * Context benchmark — runs every golden task (knowledge/golden/tasks.yaml)
 * through the in-process resolver and measures latency percentiles, context
 * size, and routing precision. Also verifies every golden question's sources
 * still exist. Hard failures: wrong task type/lane, missing mustInclude path,
 * or p95 over the policy target.
 */
import { existsSync } from 'node:fs';

import { runAsCli } from './lib/cli.mjs';
import { generatedPath, recordGeneratedFrom } from './lib/manifest-io.mjs';
import { fromRepo } from './lib/paths.mjs';
import { loadResolverRuntime } from './lib/resolver/classify.mjs';
import { writeJson } from './lib/stable-json.mjs';
import { loadYamlFile } from './lib/yaml-io.mjs';
import { resolveContext } from './resolve-context.mjs';

const TASKS_FILE = 'knowledge/golden/tasks.yaml';
const QUESTIONS_FILE = 'knowledge/golden/questions.yaml';
const BUDGETS_FILE = 'knowledge/context-budget-policy.yaml';

const percentile = (sorted, fraction) =>
  sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];

const contextContains = (context, path) =>
  context.docs.includes(path) ||
  context.source.includes(path) ||
  context.tests.includes(path) ||
  context.skills.includes(path) ||
  context.reviewers.includes(path) ||
  context.pack === path;

const runGoldenTask = (goldenTask, runtime) => {
  const { context, elapsedMs } = resolveContext({
    taskText: goldenTask.task,
    files: goldenTask.files ?? [],
    runtime,
  });
  const failures = [];
  if (context.taskType !== goldenTask.expect.taskType) {
    failures.push(`taskType ${context.taskType} (expected ${goldenTask.expect.taskType})`);
  }
  if (context.lane !== goldenTask.expect.lane) {
    failures.push(`lane ${context.lane} (expected ${goldenTask.expect.lane})`);
  }
  const mustInclude = goldenTask.expect.mustInclude ?? [];
  for (const path of mustInclude) {
    if (!contextContains(context, path)) {
      failures.push(`missing ${path}`);
    }
  }
  return {
    docCount: context.docs.length,
    elapsedMs: Math.round(elapsedMs * 100) / 100,
    failures,
    id: goldenTask.id,
    taskType: context.taskType,
    tokens: context.estimatedTokens,
  };
};

const verifyQuestionSources = () => {
  const questions = loadYamlFile(QUESTIONS_FILE);
  const missing = [];
  for (const question of questions.questions) {
    for (const source of [question.canonicalSource, ...(question.codeEvidence ?? [])]) {
      if (!existsSync(fromRepo(source))) {
        missing.push(`${question.id}: ${source}`);
      }
    }
  }
  return missing;
};

export const benchmarkContext = () => {
  const definition = loadYamlFile(TASKS_FILE);
  const budgets = loadYamlFile(BUDGETS_FILE);
  const runtime = loadResolverRuntime();
  // Warm run to exclude one-time index loading from per-task numbers.
  resolveContext({ taskText: 'warmup', files: [], runtime });

  const results = definition.tasks.map((goldenTask) => runGoldenTask(goldenTask, runtime));
  const timings = results.map((result) => result.elapsedMs).toSorted((a, b) => a - b);
  const report = {
    docCountMax: Math.max(...results.map((result) => result.docCount)),
    failures: results.filter((result) => result.failures.length > 0),
    missingQuestionSources: verifyQuestionSources(),
    p50Ms: percentile(timings, 0.5),
    p95Ms: percentile(timings, 0.95),
    results,
    targets: budgets.resolver,
    taskCount: results.length,
    tokensMax: Math.max(...results.map((result) => result.tokens)),
  };
  const output = generatedPath('context-performance');
  writeJson(output, report);
  recordGeneratedFrom(output, [TASKS_FILE, QUESTIONS_FILE, BUDGETS_FILE]);
  return report;
};

await runAsCli(import.meta.url, 'benchmark-context', () => {
  const report = benchmarkContext();
  for (const result of report.results) {
    const status = result.failures.length === 0 ? 'ok  ' : 'FAIL';
    console.log(
      `  ${status} ${result.id.padEnd(22)} ${String(result.elapsedMs).padStart(7)}ms  ~${String(result.tokens).padStart(5)} tok  ${result.taskType}${result.failures.length > 0 ? `  ← ${result.failures.join('; ')}` : ''}`,
    );
  }
  console.log(`  p50 ${report.p50Ms}ms · p95 ${report.p95Ms}ms · max docs ${report.docCountMax}`);
  const problems = [];
  if (report.failures.length > 0) {
    problems.push(`${report.failures.length} golden task failure(s)`);
  }
  if (report.missingQuestionSources.length > 0) {
    problems.push(`${report.missingQuestionSources.length} missing question source(s)`);
  }
  if (report.p95Ms > report.targets.p95TargetMs) {
    problems.push(`p95 ${report.p95Ms}ms exceeds ${report.targets.p95TargetMs}ms`);
  }
  if (problems.length > 0) {
    throw new Error(problems.join('; '));
  }
  return `${report.taskCount} golden tasks green (p50 ${report.p50Ms}ms, p95 ${report.p95Ms}ms)`;
});
