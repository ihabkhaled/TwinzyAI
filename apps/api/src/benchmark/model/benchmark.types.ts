import type { AiRouteEntry } from '../../config/ai-route.types';
import type { GeminiStepValue } from '../../config/gemini-step.constants';
import type { AiImageInput } from '../../modules/ai/model/gemini.types';

export type BenchmarkMode = 'mock' | 'real';

/** Parsed CLI options for one benchmark run. */
export interface BenchmarkCliOptions {
  readonly mode: BenchmarkMode;
  readonly samples: number;
  readonly photoPath?: string | undefined;
  readonly outDir: string;
}

/** One measured provider call. */
export interface BenchmarkSample {
  readonly ms: number;
  readonly schemaOk: boolean;
  readonly safetyOk: boolean;
  readonly failed: boolean;
  readonly reason?: string | undefined;
}

/** Aggregated metrics for one route entry on one step. */
export interface EntryMetrics {
  readonly entryKey: string;
  readonly samples: number;
  readonly schemaOkRate: number;
  readonly safetyOkRate: number;
  readonly failureRate: number;
  readonly p50Ms: number;
  readonly p95Ms: number;
  readonly score: number;
}

/** All measured entries for one pipeline step. */
export interface StepBenchmarkResult {
  readonly step: GeminiStepValue;
  readonly entries: readonly EntryMetrics[];
  readonly recommendation?: string | undefined;
  readonly notes: readonly string[];
}

/** The full run: per-step results plus run metadata. */
export interface BenchmarkReport {
  readonly mode: BenchmarkMode;
  readonly startedAtIso: string;
  readonly samplesPerEntry: number;
  readonly steps: readonly StepBenchmarkResult[];
  readonly caveats: readonly string[];
}

/** One real-mode entry measurement request (bundled to keep params small). */
export interface RealEntryRunInput {
  readonly step: GeminiStepValue;
  readonly entry: AiRouteEntry;
  readonly image: AiImageInput | undefined;
  readonly samplesPerEntry: number;
}

/** A step's benchmark candidates: the route entries to measure. */
export interface StepCandidates {
  readonly step: GeminiStepValue;
  readonly entries: readonly AiRouteEntry[];
}

/** Scoring weights (schema validity dominates; safety close behind; speed last). */
export const BENCHMARK_SCORE_WEIGHTS = {
  schema: 0.5,
  safety: 0.3,
  speed: 0.2,
} as const;

/** Latency (ms) at or above which the speed component scores zero. */
export const BENCHMARK_SPEED_CEILING_MS = 120_000;

/** Score rounding precision (3 decimals). */
export const BENCHMARK_SCORE_PRECISION = 1000;

/** Percent scale for report rendering. */
export const BENCHMARK_PERCENT_SCALE = 100;

/** Mock-mode synthetic latency shape (deterministic; no randomness). */
export const MOCK_LATENCY_BASE_MS = 1200;
export const MOCK_LATENCY_STEP_MS = 37;
export const MOCK_LATENCY_JITTER_RANGE_MS = 400;

/** Percentile helpers (nearest-rank). */
export const PERCENTILE_SCALE = 100;
export const P50 = 50;
export const P95 = 95;

/** JSON report indentation. */
export const JSON_REPORT_INDENT = 2;
