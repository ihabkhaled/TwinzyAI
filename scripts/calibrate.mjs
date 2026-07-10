#!/usr/bin/env node
/**
 * Live quality-calibration harness for the written-traits pipeline. Sends
 * one or more real photos through a RUNNING Twinzy API and prints a compact,
 * quality-focused report per photo: the ranked public-figure matches with
 * their style/vibe score and confidence, plus optional expected-name recall
 * for operator-owned test cases.
 *
 * This is the tool for the "rounds of testing with written conclusions" step:
 * run it against your own photos, read the report, and paste conclusions into
 * docs/features/visual-similarity-pivot/20-uat-report.md.
 *
 * It needs a real backend: the API must be running with a valid GEMINI_API_KEY
 * (the photo is sent only to the trait-extraction model).
 * The image is never stored server-side (policy); this script also never writes
 * the image anywhere, only the text results.
 *
 * Usage:
 *   node scripts/calibrate.mjs ./me1.jpg ./me2.jpg
 *   EXPECT="Some Actor Name" node scripts/calibrate.mjs ./me1.jpg
 *   API_BASE=http://localhost:8080 RESULT_COUNT=10 LANG=en \
 *     node scripts/calibrate.mjs ./photos/*.jpg
 *
 * Env:
 *   API_BASE      default http://localhost:8080
 *   RESULT_COUNT  default 10   (1..10 — how many matches to request)
 *   LANG          default en   (en | ar)
 *   EXPECT        optional comma-separated names to check recall for
 *   TOP_CONF_BAR  default 90   (rank-1 fit score at/above this = calibrated)
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { GAME_ANALYZE_PATH } from '@twinzy/shared';

const API_BASE = process.env.API_BASE ?? 'http://localhost:8080';
const RESULT_COUNT = process.env.RESULT_COUNT ?? '10';
const LANG = process.env.LANG ?? 'en';
const TOP_CONF_BAR = Number(process.env.TOP_CONF_BAR ?? '90');
const EXPECT = (process.env.EXPECT ?? '')
  .split(',')
  .map((name) => name.trim())
  .filter((name) => name.length > 0);

const photos = process.argv.slice(2);

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const mimeFor = (file) =>
  MIME_BY_EXT[path.extname(file).toLowerCase()] ?? 'application/octet-stream';

const analyzeOne = async (file) => {
  const buffer = readFileSync(file);
  try {
    const form = new globalThis.FormData();
    form.append(
      'image',
      new globalThis.Blob([buffer], { type: mimeFor(file) }),
      path.basename(file),
    );
    form.append('consent', 'true');
    form.append('languageCode', LANG);
    form.append('resultCount', RESULT_COUNT);

    const response = await globalThis.fetch(`${API_BASE}${GAME_ANALYZE_PATH}`, {
      method: 'POST',
      body: form,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${payload.errorCode ?? 'unknown'} ${payload.message ?? ''}`,
      );
    }
    return payload;
  } finally {
    buffer.fill(0);
  }
};

const recallFor = (results) =>
  EXPECT.map((expected) => {
    const needle = expected.toLowerCase();
    const hit = results.find((item) => String(item.name).toLowerCase().includes(needle));
    return {
      expected,
      rank: hit ? hit.rank : null,
      score: hit ? hit.finalStyleVibeFitScore : null,
    };
  });

const reportOne = (file, payload) => {
  const results = Array.isArray(payload.results) ? payload.results : [];
  console.log(`\n=== ${path.basename(file)} ===`);
  console.log(`traits read: ${payload.traitCount ?? '?'} | matches: ${results.length}`);
  for (const item of results.slice(0, 5)) {
    console.log(
      `  #${item.rank}  ${item.name}  — score ${item.finalStyleVibeFitScore}, ` +
        `${item.confidenceLevel} confidence, ${item.verdict}`,
    );
  }

  const top = results[0];
  const calibrated = top !== undefined && Number(top.finalStyleVibeFitScore) >= TOP_CONF_BAR;
  console.log(
    `  top-match bar (>=${TOP_CONF_BAR}): ${calibrated ? 'PASS' : 'below'} ` +
      `(rank-1 = ${top ? top.finalStyleVibeFitScore : 'n/a'})`,
  );

  if (EXPECT.length > 0) {
    for (const { expected, rank, score } of recallFor(results)) {
      console.log(
        rank === null
          ? `  expected "${expected}": NOT in top ${results.length}`
          : `  expected "${expected}": found at rank ${rank} (score ${score})`,
      );
    }
  }
  return { calibrated, recall: recallFor(results) };
};

const run = async () => {
  if (photos.length === 0) {
    console.error('Provide at least one photo path: node scripts/calibrate.mjs ./me.jpg');
    process.exitCode = 1;
    return;
  }
  console.log(
    `Calibrating ${photos.length} photo(s) → ${API_BASE} | lang=${LANG} | resultCount=${RESULT_COUNT}`,
  );
  if (EXPECT.length > 0) {
    console.log(`Expected-name recall: ${EXPECT.join(', ')}`);
  }

  let calibratedCount = 0;
  for (const file of photos) {
    try {
      // Sequential on purpose: the analyze route is rate-limited (10/min) and
      // each call is an expensive multi-step model pipeline.
      const payload = await analyzeOne(file);
      const { calibrated } = reportOne(file, payload);
      if (calibrated) {
        calibratedCount += 1;
      }
    } catch (error) {
      console.error(
        `\n=== ${path.basename(file)} ===\n  ERROR: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
  console.log(
    `\n--- ${calibratedCount}/${photos.length} photo(s) met the rank-1 >=${TOP_CONF_BAR} bar ---`,
  );
};

await run();
