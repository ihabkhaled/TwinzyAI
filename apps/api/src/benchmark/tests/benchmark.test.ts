import { describe, expect, it } from 'vitest';

import { GeminiStep } from '../../config/gemini-step.constants';
import {
  buildBrokenResponseText,
  buildUnsafeResponseText,
  buildValidResponseText,
} from '../benchmark-fixtures';
import { toJsonReport, toMarkdownReport } from '../benchmark-report';
import { runMockBenchmark } from '../benchmark-runner';
import {
  aggregateEntryMetrics,
  evaluateResponseText,
  passesSafetyScan,
  percentileMs,
} from '../lib/benchmark-metrics.util';

const STEPS = Object.values(GeminiStep);

describe('benchmark fixtures + evaluation', () => {
  it('valid fixtures pass schema + safety for every step', () => {
    for (const step of STEPS) {
      const sample = evaluateResponseText(step, buildValidResponseText(step), 100);
      expect(sample.schemaOk, `schema for ${step}`).toBe(true);
      expect(sample.safetyOk, `safety for ${step}`).toBe(true);
    }
  });

  it('broken fixtures fail schema for every step', () => {
    for (const step of STEPS) {
      const sample = evaluateResponseText(step, buildBrokenResponseText(), 100);
      expect(sample.schemaOk, `schema for ${step}`).toBe(false);
    }
  });

  it('unsafe fixtures fail the safety scan on every wording-carrying step', () => {
    for (const step of [GeminiStep.Generation, GeminiStep.Judge, GeminiStep.Translation]) {
      expect(passesSafetyScan(buildUnsafeResponseText(step)), `safety for ${step}`).toBe(false);
    }
  });
});

describe('benchmark metrics', () => {
  it('computes nearest-rank percentiles over successful samples only', () => {
    const samples = [100, 200, 300, 400].map((ms) => ({
      ms,
      schemaOk: true,
      safetyOk: true,
      failed: false,
    }));
    const withFailure = [...samples, { ms: 9999, schemaOk: false, safetyOk: false, failed: true }];
    expect(percentileMs(withFailure, 50)).toBe(200);
    expect(percentileMs(withFailure, 95)).toBe(400);
  });

  it('scores schema validity above safety above speed', () => {
    const good = aggregateEntryMetrics('a', [
      { ms: 1000, schemaOk: true, safetyOk: true, failed: false },
    ]);
    const unsafe = aggregateEntryMetrics('b', [
      { ms: 1000, schemaOk: true, safetyOk: false, failed: false },
    ]);
    const broken = aggregateEntryMetrics('c', [
      { ms: 1000, schemaOk: false, safetyOk: true, failed: false },
    ]);
    expect(good.score).toBeGreaterThan(unsafe.score);
    expect(unsafe.score).toBeGreaterThan(broken.score);
  });
});

describe('mock benchmark run', () => {
  it('is deterministic and ranks the valid mock model first on every step', () => {
    const first = runMockBenchmark(3, '2026-07-09T00:00:00.000Z');
    const second = runMockBenchmark(3, '2026-07-09T00:00:00.000Z');
    expect(toJsonReport(first)).toBe(toJsonReport(second));

    for (const step of first.steps) {
      expect(step.recommendation).toContain('mock:valid-model');
    }
  });

  it('renders a markdown report with a table per step and the caveats', () => {
    const markdown = toMarkdownReport(runMockBenchmark(2, '2026-07-09T00:00:00.000Z'));
    expect(markdown).toContain('# TwinzyAI AI Benchmark — MOCK mode');
    expect(markdown).toContain('MOCK MODE');
    for (const step of STEPS) {
      expect(markdown).toContain(`## Step: ${step}`);
    }
    expect(markdown).toContain('| entry | samples | schemaOk |');
  });
});
