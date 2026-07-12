/**
 * Tiny CLI harness so every compiler script is both an importable module and a
 * standalone command. Failures set the exit code (never `process.exit`) so
 * stdout/stderr flush normally under npm.
 */
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const isMainModule = (importMetaUrl) => {
  const entry = process.argv[1];
  return entry !== undefined && importMetaUrl === pathToFileURL(entry).href;
};

/**
 * Run `fn` when the module is the process entrypoint. `fn` may be async and
 * may return a short status string for the log line. Throwing marks the
 * process failed.
 */
export const runAsCli = async (importMetaUrl, label, fn) => {
  if (!isMainModule(importMetaUrl)) {
    return;
  }
  try {
    const startedAt = process.hrtime.bigint();
    const result = await fn();
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const suffix = typeof result === 'string' ? ` — ${result}` : '';
    console.log(`[knowledge] ${label} ok in ${elapsedMs.toFixed(0)}ms${suffix}`);
  } catch (error) {
    console.error(`[knowledge] ${label} FAILED:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
};
