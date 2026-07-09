#!/usr/bin/env node
/**
 * Dependency-free load generator for a running Twinzy instance. Fires a bounded
 * pool of concurrent requests at a target URL for a fixed duration and reports
 * throughput, status distribution, and latency percentiles.
 *
 * The point is to prove the two scalability guarantees that matter for this app
 * (see memory/performance-decisions.md): the HTTP layer stays non-blocking under
 * concurrency, and the per-IP throttler sheds excess load with 429s instead of
 * melting down. It uses only Node built-ins (global fetch), so it runs anywhere
 * the app runs — no k6/autocannon install.
 *
 * Usage:
 *   node scripts/load-test.mjs                        # defaults below
 *   TARGET_URL=http://localhost:8080/api/v1/health \
 *   CONCURRENCY=100 DURATION_SECONDS=15 node scripts/load-test.mjs
 *
 * Env:
 *   TARGET_URL         default http://localhost:8080/api/v1/health
 *   CONCURRENCY        default 50   (parallel in-flight requests)
 *   DURATION_SECONDS   default 10
 *   METHOD             default GET
 *   FAIL_ON_ERROR_RATE default 0.5  (exit 1 if non-2xx/429 ratio exceeds this)
 *
 * Note: point this at the API health route or a cheap endpoint. Do NOT point it
 * at /api/v1/game/analyze — that path calls the paid AI provider and is
 * deliberately rate-limited to 10 req/min.
 */

import { performance } from 'node:perf_hooks';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8080/api/v1/health';
const CONCURRENCY = Number(process.env.CONCURRENCY ?? '50');
const DURATION_SECONDS = Number(process.env.DURATION_SECONDS ?? '10');
const METHOD = process.env.METHOD ?? 'GET';
const FAIL_ON_ERROR_RATE = Number(process.env.FAIL_ON_ERROR_RATE ?? '0.5');

/** @type {number[]} */
const latencies = [];
/** @type {Map<number | string, number>} */
const statusCounts = new Map();
let sent = 0;

const bump = (key) => statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);

const oneRequest = async () => {
  const startedAt = performance.now();
  try {
    const response = await globalThis.fetch(TARGET_URL, { method: METHOD });
    // Drain the body so the socket is released back to the pool.
    await response.arrayBuffer();
    latencies.push(performance.now() - startedAt);
    bump(response.status);
  } catch (error) {
    latencies.push(performance.now() - startedAt);
    bump(error instanceof Error ? error.name : 'error');
  }
  sent += 1;
};

const worker = async (deadline) => {
  while (performance.now() < deadline) {
    await oneRequest();
  }
};

const percentile = (sorted, p) => {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
};

const round = (value) => Math.round(value * 100) / 100;

const run = async () => {
  console.log(
    `Load test → ${METHOD} ${TARGET_URL} | concurrency=${CONCURRENCY} | duration=${DURATION_SECONDS}s`,
  );
  const deadline = performance.now() + DURATION_SECONDS * 1000;
  const startedAt = performance.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(deadline)));
  const elapsedSeconds = (performance.now() - startedAt) / 1000;

  const sorted = latencies.toSorted((a, b) => a - b);
  const ok = (statusCounts.get(200) ?? 0) + (statusCounts.get(204) ?? 0);
  const throttled = statusCounts.get(429) ?? 0;
  const errors = sent - ok - throttled;
  const errorRate = sent === 0 ? 0 : errors / sent;

  console.log('\n--- results ---');
  console.log(
    `requests:    ${sent}  (${round(sent / elapsedSeconds)} req/s over ${round(elapsedSeconds)}s)`,
  );
  console.log(`2xx:         ${ok}`);
  console.log(`429 (shed):  ${throttled}`);
  console.log(`other/error: ${errors}  (${round(errorRate * 100)}%)`);
  console.log('status distribution:');
  for (const [status, count] of [...statusCounts.entries()].toSorted()) {
    console.log(`  ${status}: ${count}`);
  }
  console.log('latency (ms):');
  console.log(`  p50=${round(percentile(sorted, 50))}  p90=${round(percentile(sorted, 90))}`);
  console.log(`  p95=${round(percentile(sorted, 95))}  p99=${round(percentile(sorted, 99))}`);
  console.log(`  max=${round(sorted.at(-1) ?? 0)}`);

  if (errorRate > FAIL_ON_ERROR_RATE) {
    console.error(
      `\nFAIL: error rate ${round(errorRate * 100)}% exceeds ${round(FAIL_ON_ERROR_RATE * 100)}%`,
    );
    process.exitCode = 1;
  }
};

await run();
