import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';
import { AppLogger } from '../logger/app-logger.service';

import { StreamAbortReason } from './stream-abort.constants';
import type { StreamCancelKey, StreamRegistration } from './stream-registry.types';

const LOG_CONTEXT = 'StreamRegistry';

interface RegistryEntry {
  readonly controller: AbortController;
  readonly tabId: string;
  readonly requestId: string;
  readonly expiresAt: number;
}

/**
 * Tracks every in-flight streaming analysis by its server-minted `streamId` so
 * a later cancel request can abort exactly the right run, and a background
 * sweep can reclaim orphaned entries past their TTL. Holds only ids and an
 * AbortController — never image bytes or user data. Single-process/in-memory:
 * it governs one API instance (documented limitation for horizontal scaling).
 */
@Injectable()
export class StreamRegistry implements OnModuleInit, OnModuleDestroy {
  private readonly streams = new Map<string, RegistryEntry>();

  private sweepTimer: ReturnType<typeof setInterval> | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      this.sweep();
    }, this.config.streamTtlMs);
    if (typeof this.sweepTimer.unref === 'function') {
      this.sweepTimer.unref();
    }
  }

  public onModuleDestroy(): void {
    if (this.sweepTimer !== undefined) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = undefined;
    }
    this.streams.clear();
  }

  /** True when a run with this requestId is already live (duplicate/replay). */
  public isRequestActive(requestId: string): boolean {
    for (const entry of this.streams.values()) {
      if (entry.requestId === requestId) {
        return true;
      }
    }
    return false;
  }

  public register(registration: StreamRegistration): void {
    this.streams.set(registration.streamId, {
      controller: registration.controller,
      tabId: registration.tabId,
      requestId: registration.requestId,
      expiresAt: Date.now() + this.config.streamTtlMs,
    });
  }

  /**
   * Abort the stream identified by `streamId`, but only when `tabId` AND
   * `requestId` also match. Returns whether a matching run was aborted; the
   * entry itself is removed by the owning stream's terminal cleanup.
   */
  public cancel(key: StreamCancelKey): boolean {
    const entry = this.streams.get(key.streamId);
    if (entry === undefined) {
      return false;
    }
    if (entry.tabId !== key.tabId || entry.requestId !== key.requestId) {
      return false;
    }
    entry.controller.abort(StreamAbortReason.Cancel);
    return true;
  }

  public release(streamId: string): void {
    this.streams.delete(streamId);
  }

  public get activeCount(): number {
    return this.streams.size;
  }

  /** Abort + reclaim entries past their TTL. Returns how many were reaped. */
  public sweep(now: number = Date.now()): number {
    let reaped = 0;
    for (const [streamId, entry] of this.streams) {
      if (now < entry.expiresAt) {
        continue;
      }

      entry.controller.abort(StreamAbortReason.Timeout);
      this.streams.delete(streamId);
      reaped += 1;
    }
    if (reaped > 0) {
      this.logger.warn(`Reaped ${reaped} stale stream(s) past TTL`);
    }
    return reaped;
  }
}
