import { describe, expect, it, vi } from 'vitest';

import { GeminiStep } from '../../../config/gemini-step.constants';
import { buildConfigStub } from '../../../tests/fixtures/stubs';
import { AiStepConcurrencyGate } from '../application/ai-step-concurrency.gate';

const flushMicrotasks = (): Promise<void> => Promise.resolve();

/** A task that occupies its permit until the fake timer for `ms` elapses. */
const holdFor = (ms: number, value: string) => (): Promise<string> =>
  new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(value);
    }, ms);
  });

describe('AiStepConcurrencyGate', () => {
  it('passes ungated steps (extraction) straight through', async () => {
    const gate = new AiStepConcurrencyGate(buildConfigStub());
    const task = vi.fn(() => Promise.resolve('extracted'));

    await expect(gate.run(GeminiStep.Extraction, task)).resolves.toBe('extracted');
    expect(task).toHaveBeenCalledTimes(1);
    expect(gate.availablePermits(GeminiStep.Extraction)).toBeUndefined();
  });

  it('bounds a step to its configured concurrency', async () => {
    vi.useFakeTimers();
    try {
      const gate = new AiStepConcurrencyGate(buildConfigStub({ aiGenerationConcurrency: 1 }));
      const secondTask = vi.fn(() => Promise.resolve('second'));

      const firstRun = gate.run(GeminiStep.Generation, holdFor(10_000, 'first'));
      const secondRun = gate.run(GeminiStep.Generation, secondTask);
      await flushMicrotasks();

      // Only one permit exists: the second task must not start until it frees.
      expect(secondTask).not.toHaveBeenCalled();
      expect(gate.availablePermits(GeminiStep.Generation)).toBe(0);

      await vi.advanceTimersByTimeAsync(10_000);
      await expect(firstRun).resolves.toBe('first');
      await expect(secondRun).resolves.toBe('second');
      expect(secondTask).toHaveBeenCalledTimes(1);
      expect(gate.availablePermits(GeminiStep.Generation)).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('never starts a queued task whose signal aborts while it waits', async () => {
    vi.useFakeTimers();
    try {
      const gate = new AiStepConcurrencyGate(buildConfigStub({ aiGenerationConcurrency: 1 }));
      const controller = new AbortController();
      const queuedTask = vi.fn(() => Promise.resolve('queued'));

      const holdingRun = gate.run(GeminiStep.Generation, holdFor(10_000, 'done'));
      const queuedRun = gate.run(GeminiStep.Generation, queuedTask, { signal: controller.signal });
      queuedRun.catch(() => null);
      await flushMicrotasks();

      controller.abort(new Error('cancelled'));
      await expect(queuedRun).rejects.toThrow('cancelled');
      expect(queuedTask).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10_000);
      await expect(holdingRun).resolves.toBe('done');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not run the task when the signal is already aborted at run time', async () => {
    const gate = new AiStepConcurrencyGate(buildConfigStub({ aiGenerationConcurrency: 2 }));
    const controller = new AbortController();
    controller.abort(new Error('pre-aborted'));
    const task = vi.fn(() => Promise.resolve('never'));

    await expect(
      gate.run(GeminiStep.Generation, task, { signal: controller.signal }),
    ).rejects.toThrow();
    expect(task).not.toHaveBeenCalled();
    // An already-aborted acquire rejects before any permit is consumed.
    expect(gate.availablePermits(GeminiStep.Generation)).toBe(2);
  });
});
