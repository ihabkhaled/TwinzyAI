import { describe, expect, it, vi } from 'vitest';

import {
  type AppLoggerStub,
  buildAppLoggerStub,
  buildConfigStub,
} from '../../../tests/fixtures/stubs';
import { StreamAbortReason } from '../stream-abort.constants';
import { StreamRegistry } from '../stream-registry.service';

const S1 = 'stream-1';
const T1 = 'tab-1';
const R1 = 'req-1';

interface Harness {
  readonly registry: StreamRegistry;
  readonly loggerStub: AppLoggerStub;
}

const build = (overrides: Record<string, number> = {}): Harness => {
  const loggerStub = buildAppLoggerStub();
  const registry = new StreamRegistry(
    buildConfigStub({ streamTtlMs: 1000, ...overrides }),
    loggerStub.logger,
  );
  return { registry, loggerStub };
};

const register = (registry: StreamRegistry, controller: AbortController): void => {
  registry.register({ streamId: S1, tabId: T1, requestId: R1, controller });
};

describe('StreamRegistry', () => {
  it('reports a requestId active only while it is registered', () => {
    const { registry } = build();

    expect(registry.isRequestActive(R1)).toBe(false);
    register(registry, new AbortController());
    expect(registry.isRequestActive(R1)).toBe(true);
    expect(registry.isRequestActive('other-request')).toBe(false);
    expect(registry.activeCount).toBe(1);
  });

  it('cancels only when streamId, tabId, and requestId all match', () => {
    const { registry } = build();
    const controller = new AbortController();
    register(registry, controller);

    expect(registry.cancel({ streamId: 'nope', tabId: T1, requestId: R1 })).toBe(false);
    expect(registry.cancel({ streamId: S1, tabId: 'wrong', requestId: R1 })).toBe(false);
    expect(registry.cancel({ streamId: S1, tabId: T1, requestId: 'wrong' })).toBe(false);
    expect(controller.signal.aborted).toBe(false);

    expect(registry.cancel({ streamId: S1, tabId: T1, requestId: R1 })).toBe(true);
    expect(controller.signal.aborted).toBe(true);
    expect(controller.signal.reason).toBe(StreamAbortReason.Cancel);
  });

  it('release removes the entry', () => {
    const { registry } = build();
    register(registry, new AbortController());

    registry.release(S1);

    expect(registry.activeCount).toBe(0);
    expect(registry.isRequestActive(R1)).toBe(false);
  });

  it('sweep aborts and reclaims only entries past their TTL', () => {
    const { registry, loggerStub } = build({ streamTtlMs: 1000 });
    const controller = new AbortController();
    register(registry, controller);

    const reaped = registry.sweep(Date.now() + 2000);

    expect(reaped).toBe(1);
    expect(controller.signal.aborted).toBe(true);
    expect(controller.signal.reason).toBe(StreamAbortReason.Timeout);
    expect(registry.activeCount).toBe(0);
    expect(loggerStub.messages().some((message) => message.includes('Reaped'))).toBe(true);
  });

  it('sweep is a no-op when nothing is expired', () => {
    const { registry, loggerStub } = build({ streamTtlMs: 100_000 });
    register(registry, new AbortController());

    expect(registry.sweep(Date.now())).toBe(0);
    expect(registry.activeCount).toBe(1);
    expect(loggerStub.messages().some((message) => message.includes('Reaped'))).toBe(false);
  });

  it('reaps on its sweep interval and stops cleanly on destroy', () => {
    vi.useFakeTimers();
    try {
      const { registry } = build({ streamTtlMs: 1000 });
      const controller = new AbortController();
      register(registry, controller);

      registry.onModuleInit();
      vi.advanceTimersByTime(1000);

      expect(controller.signal.aborted).toBe(true);
      expect(registry.activeCount).toBe(0);
      registry.onModuleDestroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('onModuleDestroy without a prior init is safe', () => {
    const { registry } = build();
    register(registry, new AbortController());

    registry.onModuleDestroy();

    expect(registry.activeCount).toBe(0);
  });
});
