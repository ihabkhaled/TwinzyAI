import { describe, expect, it, vi } from 'vitest';

import { CONCURRENCY_TIMEOUT_ERROR_NAME, ConcurrencyTimeoutError, Semaphore } from '..';

describe('Semaphore', () => {
  it('grants immediately while permits are free and tracks the count', async () => {
    const semaphore = new Semaphore(2);
    expect(semaphore.availablePermits).toBe(2);

    const releaseA = await semaphore.acquire();
    expect(semaphore.availablePermits).toBe(1);
    const releaseB = await semaphore.acquire();
    expect(semaphore.availablePermits).toBe(0);

    releaseA();
    expect(semaphore.availablePermits).toBe(1);
    releaseB();
    expect(semaphore.availablePermits).toBe(2);
  });

  it('clamps a non-positive permit count to zero', () => {
    expect(new Semaphore(0).availablePermits).toBe(0);
    expect(new Semaphore(-4).availablePermits).toBe(0);
  });

  it('is idempotent on release: a double release frees only one permit', async () => {
    const semaphore = new Semaphore(1);
    const release = await semaphore.acquire();
    release();
    release();
    expect(semaphore.availablePermits).toBe(1);
  });

  it('queues acquirers over the limit and wakes them FIFO as permits free', async () => {
    const semaphore = new Semaphore(1);
    const first = await semaphore.acquire();

    const order: string[] = [];
    const second = semaphore.acquire().then((release) => {
      order.push('second');
      return release;
    });
    const third = semaphore.acquire().then((release) => {
      order.push('third');
      return release;
    });
    expect(semaphore.pendingCount).toBe(2);

    first();
    const secondRelease = await second;
    secondRelease();
    const thirdRelease = await third;

    expect(order).toEqual(['second', 'third']);
    thirdRelease();
    expect(semaphore.availablePermits).toBe(1);
  });

  it('rejects a queued acquire with ConcurrencyTimeoutError and leaks no permit', async () => {
    vi.useFakeTimers();
    try {
      const semaphore = new Semaphore(1);
      const held = await semaphore.acquire();

      const waiting = semaphore.acquire({ timeoutMs: 1000 });
      waiting.catch(() => null);
      await vi.advanceTimersByTimeAsync(1000);

      await expect(waiting).rejects.toBeInstanceOf(ConcurrencyTimeoutError);
      await expect(waiting).rejects.toMatchObject({ name: CONCURRENCY_TIMEOUT_ERROR_NAME });
      expect(semaphore.pendingCount).toBe(0);

      held();
      expect(semaphore.availablePermits).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects immediately when the signal is already aborted, consuming no permit', async () => {
    const semaphore = new Semaphore(1);
    const controller = new AbortController();
    controller.abort(new Error('already gone'));

    await expect(semaphore.acquire({ signal: controller.signal })).rejects.toThrow('already gone');
    expect(semaphore.availablePermits).toBe(1);
  });

  it('rejects a queued acquire when its signal aborts and passes the permit on', async () => {
    const semaphore = new Semaphore(1);
    const held = await semaphore.acquire();

    const controller = new AbortController();
    const aborted = semaphore.acquire({ signal: controller.signal });
    aborted.catch(() => null);
    const next = semaphore.acquire();
    expect(semaphore.pendingCount).toBe(2);

    controller.abort(new Error('lane cancelled'));
    await expect(aborted).rejects.toThrow('lane cancelled');
    expect(semaphore.pendingCount).toBe(1);

    // The freed permit skips the settled (aborted) waiter and reaches `next`.
    held();
    const release = await next;
    expect(release).toBeTypeOf('function');
  });

  it('falls back to a named AbortError when the signal carries no Error reason', async () => {
    const semaphore = new Semaphore(1);
    const held = await semaphore.acquire();
    const controller = new AbortController();

    const aborted = semaphore.acquire({ signal: controller.signal });
    aborted.catch(() => null);
    controller.abort('plain-string-reason');

    await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
    held();
  });
});
