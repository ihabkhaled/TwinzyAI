import { GeminiStep, type GeminiStepValue } from '../config/gemini-step.constants';

import {
  buildBrokenResponseText,
  buildUnsafeResponseText,
  buildValidResponseText,
} from './benchmark-fixtures';
import { aggregateEntryMetrics, evaluateResponseText } from './lib/benchmark-metrics.util';
import {
  type BenchmarkReport,
  type BenchmarkSample,
  MOCK_LATENCY_BASE_MS,
  MOCK_LATENCY_JITTER_RANGE_MS,
  MOCK_LATENCY_STEP_MS,
  type StepBenchmarkResult,
} from './model/benchmark.types';

// Deterministic synthetic latencies for mock mode (no randomness — a mock run
// must produce byte-identical scores on every execution, including CI).
const mockLatency = (sampleIndex: number): number =>
  MOCK_LATENCY_BASE_MS + ((sampleIndex * MOCK_LATENCY_STEP_MS) % MOCK_LATENCY_JITTER_RANGE_MS);

/** The three mock "entries": a good model, a schema-broken one, an unsafe one. */
const MOCK_ENTRY_BEHAVIORS = [
  { key: 'mock:valid-model', build: buildValidResponseText },
  { key: 'mock:schema-broken-model', build: (): string => buildBrokenResponseText() },
  { key: 'mock:unsafe-model', build: buildUnsafeResponseText },
] as const;

const MOCK_CAVEATS = [
  'MOCK MODE: responses are canned fixtures and latencies are synthetic — this run validates the harness, scoring, and report format, NOT real providers.',
  'Run with --mode=real (and configured provider keys) to measure real models; real image steps additionally need --photo=<path>.',
] as const;

const runMockStep = (step: GeminiStepValue, samplesPerEntry: number): StepBenchmarkResult => {
  const entries = MOCK_ENTRY_BEHAVIORS.map((behavior) => {
    const samples: BenchmarkSample[] = [];
    for (let index = 0; index < samplesPerEntry; index += 1) {
      samples.push(evaluateResponseText(step, behavior.build(step), mockLatency(index)));
    }
    return aggregateEntryMetrics(behavior.key, samples);
  });
  const best = entries.toSorted((a, b) => b.score - a.score)[0];
  return {
    step,
    entries,
    recommendation: best === undefined ? undefined : `${best.entryKey} (score ${best.score})`,
    notes: [
      'Expected shape: valid-model scores highest; schema-broken loses the schema axis; unsafe loses the safety axis.',
    ],
  };
};

/** CI-safe harness demonstration over deterministic fixtures — zero API keys. */
export const runMockBenchmark = (
  samplesPerEntry: number,
  startedAtIso: string,
): BenchmarkReport => ({
  mode: 'mock',
  startedAtIso,
  samplesPerEntry,
  steps: Object.values(GeminiStep).map((step) => runMockStep(step, samplesPerEntry)),
  caveats: [...MOCK_CAVEATS],
});
