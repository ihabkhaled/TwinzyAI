import type { z } from 'zod';

import {
  CandidateGenerationResponseSchema,
  CandidateJudgeResponseSchema,
  FinalGameResultSchema,
  TraitExtractionResponseSchema,
} from '@twinzy/shared';

import type { GeminiStepValue } from '../../config/gemini-step.constants';
import { GeminiStep } from '../../config/gemini-step.constants';
import { containsForbiddenWording } from '../../modules/ai/lib/forbidden-wording.guard';
import { buildSchemaValidator } from '../../modules/ai/lib/json-response.util';
import type { AiContentValidator } from '../../modules/ai/model/ai-provider-adapter.types';
import {
  BENCHMARK_SCORE_PRECISION,
  BENCHMARK_SCORE_WEIGHTS,
  BENCHMARK_SPEED_CEILING_MS,
  type BenchmarkSample,
  type EntryMetrics,
  P50,
  P95,
  PERCENTILE_SCALE,
} from '../model/benchmark.types';

const SCHEMA_BY_STEP: Record<GeminiStepValue, z.ZodType> = {
  [GeminiStep.Extraction]: TraitExtractionResponseSchema,
  [GeminiStep.Generation]: CandidateGenerationResponseSchema,
  [GeminiStep.Judge]: CandidateJudgeResponseSchema,
  [GeminiStep.Translation]: FinalGameResultSchema,
};

const SERVER_OWNED_TEXT_FIELDS = new Set(['disclaimer', 'fallbackMessage']);

/** The exact validator each step's service uses in production. */
const validatorForStep = (step: GeminiStepValue): AiContentValidator =>
  buildSchemaValidator(SCHEMA_BY_STEP[step]);

/** Collect every string leaf of a parsed JSON value (bounded by JSON size). */
const collectStrings = (value: unknown, sink: string[]): void => {
  if (typeof value === 'string') {
    sink.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, sink);
    }
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      if (SERVER_OWNED_TEXT_FIELDS.has(key)) {
        continue;
      }
      collectStrings(item, sink);
    }
  }
};

/**
 * True when no string leaf contains forbidden wording. Reuses the exact
 * production guard (merged result-phrase + sensitive-topic lists), so the
 * benchmark's safety axis measures the same policy the pipeline enforces.
 */
export const passesSafetyScan = (rawText: string): boolean => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return false;
  }
  const leaves: string[] = [];
  collectStrings(parsed, leaves);
  return leaves.every((leaf) => !containsForbiddenWording(leaf));
};

/** Evaluate one raw model response on the three benchmark axes. */
export const evaluateResponseText = (
  step: GeminiStepValue,
  rawText: string,
  ms: number,
): BenchmarkSample => {
  const validation = validatorForStep(step)(rawText);
  return {
    ms,
    schemaOk: validation.ok,
    safetyOk: passesSafetyScan(rawText),
    failed: false,
    reason: validation.ok ? undefined : validation.reason,
  };
};

/** Nearest-rank percentile over the successful samples' latencies. */
export const percentileMs = (samples: readonly BenchmarkSample[], percentile: number): number => {
  const sorted = samples
    .filter((sample) => !sample.failed)
    .map((sample) => sample.ms)
    .toSorted((a, b) => a - b);
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentile / PERCENTILE_SCALE) * sorted.length) - 1,
  );
  return sorted[Math.max(0, index)] ?? 0;
};

const rate = (
  samples: readonly BenchmarkSample[],
  select: (s: BenchmarkSample) => boolean,
): number =>
  samples.length === 0 ? 0 : samples.filter((sample) => select(sample)).length / samples.length;

/** Weighted 0..1 score: schema validity, safety, then speed under the ceiling. */
export const aggregateEntryMetrics = (
  entryKey: string,
  samples: readonly BenchmarkSample[],
): EntryMetrics => {
  const schemaOkRate = rate(samples, (sample) => sample.schemaOk);
  const safetyOkRate = rate(samples, (sample) => sample.safetyOk);
  const failureRate = rate(samples, (sample) => sample.failed);
  const p50Ms = percentileMs(samples, P50);
  const p95Ms = percentileMs(samples, P95);
  const speedScore = Math.max(0, 1 - p50Ms / BENCHMARK_SPEED_CEILING_MS);
  const score =
    schemaOkRate * BENCHMARK_SCORE_WEIGHTS.schema +
    safetyOkRate * BENCHMARK_SCORE_WEIGHTS.safety +
    speedScore * BENCHMARK_SCORE_WEIGHTS.speed;

  return {
    entryKey,
    samples: samples.length,
    schemaOkRate,
    safetyOkRate,
    failureRate,
    p50Ms,
    p95Ms,
    score: Math.round(score * BENCHMARK_SCORE_PRECISION) / BENCHMARK_SCORE_PRECISION,
  };
};
