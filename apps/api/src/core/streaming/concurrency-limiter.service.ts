import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';

import type { AcquireOutcome, AnalysisSlotRequest } from './concurrency-limiter.types';

const BUSY: AcquireOutcome = { granted: false };

interface QueuedWaiter {
  readonly request: AnalysisSlotRequest;
  settled: boolean;
  resolve: (outcome: AcquireOutcome) => void;
  timer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * In-memory admission control for streaming analyses. Enforces three hard
 * ceilings — global, per client IP, and per browser tab — so a burst of tabs, a
 * bot, or a slow provider can never exhaust memory or the model quota. Runs that
 * cannot get a slot immediately wait in a bounded FIFO queue; when the queue is
 * full the request is rejected (SERVER_BUSY), and a queued waiter that is not
 * admitted within the watchdog window is rejected too. Single-process, in-memory
 * by design — it protects one API instance; horizontal scaling would need a
 * shared store, documented as a known limitation.
 */
@Injectable()
export class ConcurrencyLimiter {
  private globalActive = 0;

  private readonly perIp = new Map<string, number>();

  private readonly perTab = new Map<string, number>();

  private readonly queue: QueuedWaiter[] = [];

  public constructor(private readonly config: AppConfigService) {}

  /**
   * Try to reserve a slot. Resolves immediately with a slot when under every
   * cap, otherwise queues (up to `maxAnalysisQueueSize`) and resolves when a
   * slot frees or the watchdog window elapses; resolves `{ granted: false }`
   * when the queue is full or the wait times out.
   */
  public acquire(request: AnalysisSlotRequest): Promise<AcquireOutcome> {
    if (this.hasCapacity(request)) {
      return Promise.resolve(this.grant(request));
    }
    if (this.queue.length >= this.config.maxAnalysisQueueSize) {
      return Promise.resolve(BUSY);
    }
    return this.enqueue(request);
  }

  public get activeCount(): number {
    return this.globalActive;
  }

  public get queuedCount(): number {
    return this.queue.length;
  }

  private hasCapacity(request: AnalysisSlotRequest): boolean {
    return (
      this.globalActive < this.config.maxGlobalActiveAnalyses &&
      (this.perIp.get(request.ip) ?? 0) < this.config.maxActiveAnalysesPerIp &&
      (this.perTab.get(request.tabId) ?? 0) < this.config.maxActiveAnalysesPerTab
    );
  }

  private grant(request: AnalysisSlotRequest): AcquireOutcome {
    this.globalActive += 1;
    this.perIp.set(request.ip, (this.perIp.get(request.ip) ?? 0) + 1);
    this.perTab.set(request.tabId, (this.perTab.get(request.tabId) ?? 0) + 1);
    return { granted: true, slot: { release: this.buildRelease(request) } };
  }

  private buildRelease(request: AnalysisSlotRequest): () => void {
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.vacate(request);
      this.drain();
    };
  }

  private vacate(request: AnalysisSlotRequest): void {
    this.globalActive = Math.max(0, this.globalActive - 1);
    this.decrement(this.perIp, request.ip);
    this.decrement(this.perTab, request.tabId);
  }

  private decrement(counts: Map<string, number>, key: string): void {
    const next = (counts.get(key) ?? 0) - 1;
    if (next <= 0) {
      counts.delete(key);
    } else {
      counts.set(key, next);
    }
  }

  private enqueue(request: AnalysisSlotRequest): Promise<AcquireOutcome> {
    return new Promise<AcquireOutcome>((resolve) => {
      const waiter: QueuedWaiter = { request, settled: false, resolve, timer: undefined };
      waiter.timer = setTimeout(() => {
        this.settle(waiter, BUSY);
      }, this.config.analysisTimeoutMs);
      if (typeof waiter.timer.unref === 'function') {
        waiter.timer.unref();
      }
      this.queue.push(waiter);
    });
  }

  private settle(waiter: QueuedWaiter, outcome: AcquireOutcome): void {
    if (waiter.settled) {
      return;
    }
    waiter.settled = true;
    if (waiter.timer !== undefined) {
      clearTimeout(waiter.timer);
    }
    const index = this.queue.indexOf(waiter);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    waiter.resolve(outcome);
  }

  /** Promote every queued waiter that now fits under the caps, FIFO order. */
  private drain(): void {
    let index = 0;
    while (index < this.queue.length) {
      const waiter = this.queue[index];
      if (waiter === undefined || waiter.settled || !this.hasCapacity(waiter.request)) {
        index += 1;
        continue;
      }
      this.settle(waiter, this.grant(waiter.request));
      // `settle` spliced this waiter out, so the next one shifts into `index`.
    }
  }
}
