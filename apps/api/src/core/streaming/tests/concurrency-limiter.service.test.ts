import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildConfigStub } from '../../../tests/fixtures/stubs';
import { ConcurrencyLimiter } from '../concurrency-limiter.service';
import type { AnalysisSlotRequest } from '../concurrency-limiter.types';

const req = (ip: string, tabId: string): AnalysisSlotRequest => ({ ip, tabId });

const buildLimiter = (overrides: Record<string, number>): ConcurrencyLimiter =>
  new ConcurrencyLimiter(
    buildConfigStub({
      maxGlobalActiveAnalyses: 1,
      maxActiveAnalysesPerIp: 1,
      maxActiveAnalysesPerTab: 1,
      maxAnalysisQueueSize: 0,
      analysisTimeoutMs: 1000,
      ...overrides,
    }),
  );

describe('ConcurrencyLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it('grants a slot immediately when under all caps', async () => {
    const limiter = buildLimiter({
      maxGlobalActiveAnalyses: 2,
      maxActiveAnalysesPerIp: 2,
      maxActiveAnalysesPerTab: 2,
    });

    const outcome = await limiter.acquire(req('ip-a', 'tabA'));

    expect(outcome.granted).toBe(true);
    expect(limiter.activeCount).toBe(1);
  });

  it('frees the slot on release and release is idempotent', async () => {
    const limiter = buildLimiter({});

    const outcome = await limiter.acquire(req('ip-a', 'tabA'));
    if (!outcome.granted) throw new Error('expected a granted slot');
    outcome.slot.release();
    outcome.slot.release();

    expect(limiter.activeCount).toBe(0);
    const again = await limiter.acquire(req('ip-a', 'tabA'));
    expect(again.granted).toBe(true);
  });

  it('rejects with busy when at the global cap and the queue is full', async () => {
    const limiter = buildLimiter({ maxActiveAnalysesPerIp: 5, maxActiveAnalysesPerTab: 5 });
    await limiter.acquire(req('ip-a', 'tabA'));

    const outcome = await limiter.acquire(req('ip-b', 'tabB'));

    expect(outcome.granted).toBe(false);
  });

  it('enforces the per-IP cap independently of other IPs', async () => {
    const limiter = buildLimiter({ maxGlobalActiveAnalyses: 10, maxActiveAnalysesPerTab: 10 });

    const first = await limiter.acquire(req('ip-a', 'tabA'));
    const sameIp = await limiter.acquire(req('ip-a', 'tabB'));
    const otherIp = await limiter.acquire(req('ip-b', 'tabC'));

    expect(first.granted).toBe(true);
    expect(sameIp.granted).toBe(false);
    expect(otherIp.granted).toBe(true);
  });

  it('enforces the per-tab cap independently of other tabs', async () => {
    const limiter = buildLimiter({ maxGlobalActiveAnalyses: 10, maxActiveAnalysesPerIp: 10 });

    const first = await limiter.acquire(req('ip-a', 'tabA'));
    const sameTab = await limiter.acquire(req('ip-b', 'tabA'));
    const otherTab = await limiter.acquire(req('ip-c', 'tabB'));

    expect(first.granted).toBe(true);
    expect(sameTab.granted).toBe(false);
    expect(otherTab.granted).toBe(true);
  });

  it('decrements a busy key without dropping its other active runs', async () => {
    const limiter = buildLimiter({
      maxGlobalActiveAnalyses: 10,
      maxActiveAnalysesPerIp: 2,
      maxActiveAnalysesPerTab: 10,
    });

    const a1 = await limiter.acquire(req('ip-a', 'tabA'));
    await limiter.acquire(req('ip-a', 'tabB'));
    if (!a1.granted) throw new Error('expected a granted slot');
    a1.slot.release();

    expect(limiter.activeCount).toBe(1);
    const a3 = await limiter.acquire(req('ip-a', 'tabC'));
    expect(a3.granted).toBe(true);
  });

  it('queues an over-capacity run and grants it when a slot frees', async () => {
    const limiter = buildLimiter({
      maxActiveAnalysesPerIp: 5,
      maxActiveAnalysesPerTab: 5,
      maxAnalysisQueueSize: 5,
    });

    const first = await limiter.acquire(req('ip-a', 'tabA'));
    if (!first.granted) throw new Error('expected a granted slot');
    const pending = limiter.acquire(req('ip-b', 'tabB'));
    expect(limiter.queuedCount).toBe(1);

    first.slot.release();
    const second = await pending;

    expect(second.granted).toBe(true);
    expect(limiter.queuedCount).toBe(0);
  });

  it('drains only as many queued waiters as the freed capacity allows', async () => {
    const limiter = buildLimiter({
      maxActiveAnalysesPerIp: 5,
      maxActiveAnalysesPerTab: 5,
      maxAnalysisQueueSize: 5,
    });

    const first = await limiter.acquire(req('ip-a', 'tabA'));
    if (!first.granted) throw new Error('expected a granted slot');
    const p1 = limiter.acquire(req('ip-b', 'tabB'));
    const p2 = limiter.acquire(req('ip-c', 'tabC'));
    expect(limiter.queuedCount).toBe(2);

    first.slot.release();
    const r1 = await p1;
    expect(r1.granted).toBe(true);
    expect(limiter.queuedCount).toBe(1);

    if (r1.granted) r1.slot.release();
    const r2 = await p2;
    expect(r2.granted).toBe(true);
  });

  it('rejects a queued waiter not admitted within the watchdog window', async () => {
    const limiter = buildLimiter({
      maxActiveAnalysesPerIp: 5,
      maxActiveAnalysesPerTab: 5,
      maxAnalysisQueueSize: 5,
      analysisTimeoutMs: 20,
    });

    await limiter.acquire(req('ip-a', 'tabA'));
    const pending = limiter.acquire(req('ip-b', 'tabB'));
    await vi.advanceTimersByTimeAsync(20);
    const outcome = await pending;

    expect(outcome.granted).toBe(false);
    expect(limiter.queuedCount).toBe(0);
  });

  it('removes a queued waiter when its request is aborted', async () => {
    const limiter = buildLimiter({
      maxActiveAnalysesPerIp: 5,
      maxActiveAnalysesPerTab: 5,
      maxAnalysisQueueSize: 5,
    });
    await limiter.acquire(req('ip-a', 'tabA'));
    const controller = new AbortController();
    const pending = limiter.acquire(req('ip-b', 'tabB'), controller.signal);

    controller.abort();
    const outcome = await pending;

    expect(outcome.granted).toBe(false);
    expect(limiter.queuedCount).toBe(0);
  });

  it('rejects an already-aborted request before granting capacity', async () => {
    const limiter = buildLimiter({});
    const controller = new AbortController();
    controller.abort();

    await expect(limiter.acquire(req('ip-a', 'tabA'), controller.signal)).resolves.toEqual({
      granted: false,
    });
    expect(limiter.activeCount).toBe(0);
  });
});
