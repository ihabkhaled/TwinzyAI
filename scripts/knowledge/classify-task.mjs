/**
 * Task classifier CLI — classification only (type, lane, modules, symbols),
 * without building the full context. Useful for scripting and hooks.
 *
 *   node scripts/knowledge/classify-task.mjs --task="..." [--files=a,b]
 */
import process from 'node:process';
import { parseArgs } from 'node:util';

import { runAsCli } from './lib/cli.mjs';
import {
  classifyLane,
  classifyTaskType,
  loadResolverRuntime,
  matchModules,
  matchSymbols,
} from './lib/resolver/classify.mjs';

const main = () => {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { files: { type: 'string' }, task: { type: 'string' } },
  });
  if (values.task === undefined || values.task === '') {
    throw new Error('usage: classify-task --task="<request>" [--files=a,b]');
  }
  const files = (values.files ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  const runtime = loadResolverRuntime();
  const typeResult = classifyTaskType(runtime, values.task, files);
  const laneResult = classifyLane(
    runtime,
    values.task,
    files,
    runtime.taskTypes[typeResult.taskType].lane,
  );
  const result = {
    confidence: typeResult.confidence,
    hits: typeResult.hits,
    lane: laneResult.lane,
    laneReasons: laneResult.reasons,
    modules: matchModules(runtime, values.task, files),
    runnersUp: typeResult.runnersUp,
    symbols: matchSymbols(runtime, values.task).map((hit) => hit.symbol),
    taskType: typeResult.taskType,
  };
  console.log(JSON.stringify(result, undefined, 2));
  return `${result.taskType} (${result.lane})`;
};

await runAsCli(import.meta.url, 'classify-task', () => main());
