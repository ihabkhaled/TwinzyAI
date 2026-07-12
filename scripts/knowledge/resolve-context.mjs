/**
 * Context resolver — the fast-task entrypoint. Turns an exact task statement
 * (plus optional touched files / git diff range) into a minimal context pack:
 *
 *   npm run knowledge:context -- --task="fix the upload size error copy"
 *   npm run knowledge:context -- --task="..." --files=apps/api/src/a.ts,b.ts
 *   npm run knowledge:context -- --task="..." --diff=origin/main...HEAD
 *
 * Writes `.ai/local/current-context.{json,md}` and prints the Markdown brief.
 * Reads only compiled indexes — target p50 < 300ms.
 */
import process from 'node:process';
import { parseArgs } from 'node:util';

import { runAsCli } from './lib/cli.mjs';
import { writeText } from './lib/fs-walk.mjs';
import { changedFilesInDiff } from './lib/git.mjs';
import { AI_DIRS } from './lib/paths.mjs';
import {
  classifyLane,
  classifyTaskType,
  loadResolverRuntime,
  matchModules,
  matchSymbols,
} from './lib/resolver/classify.mjs';
import { renderContextMarkdown } from './lib/resolver/render.mjs';
import { selectContext } from './lib/resolver/select.mjs';
import { writeJson } from './lib/stable-json.mjs';

/** Resolve a task in-process (also used by the benchmark harness). */
export const resolveContext = ({ taskText, files = [], runtime = loadResolverRuntime() }) => {
  const startedAt = process.hrtime.bigint();
  const typeResult = classifyTaskType(runtime, taskText, files);
  const taskTypeLane = runtime.taskTypes[typeResult.taskType].lane;
  const laneResult = classifyLane(runtime, taskText, files, taskTypeLane);
  const symbolHits = matchSymbols(runtime, taskText);
  const classification = {
    ...typeResult,
    modules: matchModules(runtime, taskText, [...files, ...symbolHits.flatMap((hit) => hit.files)]),
  };
  const context = {
    ...selectContext({
      runtime,
      classification,
      lane: laneResult.lane,
      taskText,
      files,
      symbolHits,
    }),
    confidence: typeResult.confidence,
    laneReasons: laneResult.reasons,
  };
  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  return { context, elapsedMs };
};

const parseFilesFlag = (value) =>
  value === undefined
    ? []
    : value
        .split(',')
        .map((item) => item.trim().replaceAll('\\', '/'))
        .filter((item) => item !== '');

const main = () => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      diff: { type: 'string' },
      files: { type: 'string' },
      task: { type: 'string' },
    },
  });
  if (values.task === undefined || values.task === '') {
    throw new Error('usage: knowledge:context -- --task="<request>" [--files=a,b] [--diff=range]');
  }
  const files = [
    ...parseFilesFlag(values.files),
    ...(values.diff === undefined ? [] : changedFilesInDiff(values.diff)),
  ];
  const { context, elapsedMs } = resolveContext({ taskText: values.task, files });
  const markdown = renderContextMarkdown(context, elapsedMs);
  writeJson(`${AI_DIRS.local}/current-context.json`, { ...context, elapsedMs });
  writeText(`${AI_DIRS.local}/current-context.md`, markdown);
  console.log(markdown);
  return `${context.taskType} (${context.lane}) in ${elapsedMs.toFixed(0)}ms`;
};

await runAsCli(import.meta.url, 'resolve-context', () => main());
