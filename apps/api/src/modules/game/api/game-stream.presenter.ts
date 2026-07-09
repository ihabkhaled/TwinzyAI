import { Injectable } from '@nestjs/common';

import type { ErrorStreamMessage, GameStreamStageValue } from '@twinzy/shared';
import { GameStreamEvent, StreamStatus } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { SseWriter } from '../../../core/http/sse-writer';
import { AppLogger } from '../../../core/logger';
import {
  type AnalysisSlot,
  ConcurrencyLimiter,
  StreamAbortReason,
  StreamRegistry,
} from '../../../core/streaming';
import { AnalyzeGameStreamUseCase } from '../application/analyze-game-stream.use-case';
import {
  buildBusyStreamMessage,
  buildDuplicateStreamMessage,
  type OutboundStreamStamp,
  resolveStreamTermination,
  stampStreamFrame,
  statusForStreamEvent,
  STREAM_HEARTBEAT_INTERVAL_MS,
} from '../lib/game-stream';
import { randomStreamId, resolveCorrelationId } from '../lib/stream-correlation';
import { buildStreamCorsHeaders } from '../lib/stream-cors';
import type { GameStreamRequest, StreamCorrelationIds } from '../model/game-stream.types';

const LOG_CONTEXT = 'GameStream';

/**
 * API-layer transport orchestration for the streaming analyze endpoint. Owns
 * the SSE lifecycle plus the per-stream isolation guarantees: it resolves the
 * tab/request correlation ids, admits the run through the concurrency limiter
 * (rejecting overload and duplicate requests in-band), mints the stream id,
 * registers it for cancellation, stamps every frame with the correlation
 * envelope + lifecycle status, wires client-disconnect and watchdog aborts, and
 * always releases the slot + registry entry and closes the stream exactly once.
 */
@Injectable()
export class GameStreamPresenter {
  public constructor(
    private readonly analyzeGameStreamUseCase: AnalyzeGameStreamUseCase,
    private readonly limiter: ConcurrencyLimiter,
    private readonly registry: StreamRegistry,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async stream(input: GameStreamRequest): Promise<void> {
    input.reply.hijack();
    const corsHeaders = buildStreamCorsHeaders(input.origin, this.config.corsAllowedOrigins);
    const sse = new SseWriter(input.reply.raw, corsHeaders);
    const ids: StreamCorrelationIds = {
      tabId: resolveCorrelationId(input.tabId),
      requestId: resolveCorrelationId(input.requestId),
    };

    const outcome = await this.limiter.acquire({ ip: input.ip, tabId: ids.tabId });
    if (!outcome.granted) {
      this.logger.warn('Rejected stream: over capacity');
      this.emitRejection(sse, buildBusyStreamMessage(), ids);
      sse.close();
      return;
    }

    if (this.registry.isRequestActive(ids.requestId)) {
      outcome.slot.release();
      this.logger.warn('Rejected stream: duplicate in-flight request');
      this.emitRejection(sse, buildDuplicateStreamMessage(), ids);
      sse.close();
      return;
    }

    await this.runAdmittedStream(sse, input, ids, outcome.slot);
  }

  private async runAdmittedStream(
    sse: SseWriter,
    input: GameStreamRequest,
    ids: StreamCorrelationIds,
    slot: AnalysisSlot,
  ): Promise<void> {
    const streamId = randomStreamId();
    const controller = new AbortController();
    this.registry.register({ streamId, tabId: ids.tabId, requestId: ids.requestId, controller });
    const envelope: OutboundStreamStamp = { ...ids, streamId, status: StreamStatus.Active };

    const heartbeat = setInterval(() => {
      sse.comment('keep-alive');
    }, STREAM_HEARTBEAT_INTERVAL_MS);
    const watchdog = this.startWatchdog(controller);
    sse.onClose(() => {
      if (!controller.signal.aborted) {
        controller.abort(StreamAbortReason.Disconnect);
      }
    });

    let lastStage: GameStreamStageValue | undefined;
    try {
      await this.analyzeGameStreamUseCase.analyze(
        input.file,
        input.body,
        (message) => {
          if (message.event === GameStreamEvent.Stage) {
            lastStage = message.stage;
          }
          sse.event(
            message.event,
            stampStreamFrame(message, { ...envelope, status: statusForStreamEvent(message.event) }),
          );
        },
        controller.signal,
      );
    } catch (error: unknown) {
      const termination = resolveStreamTermination(error, controller.signal);
      if (termination !== null) {
        sse.event(
          termination.message.event,
          stampStreamFrame(
            { ...termination.message, ...(lastStage === undefined ? {} : { stage: lastStage }) },
            { ...envelope, status: termination.status },
          ),
        );
      }
    } finally {
      clearInterval(heartbeat);
      clearTimeout(watchdog);
      this.registry.release(streamId);
      slot.release();
      sse.close();
    }
  }

  private startWatchdog(controller: AbortController): ReturnType<typeof setTimeout> {
    const timer = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort(StreamAbortReason.Timeout);
      }
    }, this.config.analysisTimeoutMs);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
    return timer;
  }

  private emitRejection(
    sse: SseWriter,
    message: ErrorStreamMessage,
    ids: StreamCorrelationIds,
  ): void {
    sse.event(message.event, stampStreamFrame(message, { ...ids, status: StreamStatus.Rejected }));
  }
}
