import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import type { SseCapableReplyLike } from '../../../core/http/sse.types';
import { SseWriter } from '../../../core/http/sse-writer';
import { AppLogger } from '../../../core/logger';
import type { UploadedImageFile } from '../../file-security';
import { AnalyzeGameStreamUseCase } from '../application/analyze-game-stream.use-case';
import { STREAM_HEARTBEAT_INTERVAL_MS, toStreamErrorMessage } from '../lib/game-stream';
import { buildStreamCorsHeaders } from '../lib/stream-cors';

const LOG_CONTEXT = 'GameStream';

/**
 * API-layer transport orchestration for the streaming analyze endpoint. Owns
 * the SSE lifecycle so the controller can stay a single delegation: detaches
 * the reply, pumps the use-case's progress messages out as SSE frames, keeps
 * the connection warm with heartbeats, maps any failure to a safe in-band
 * `error` event, and always closes the stream exactly once.
 */
@Injectable()
export class GameStreamPresenter {
  public constructor(
    private readonly analyzeGameStreamUseCase: AnalyzeGameStreamUseCase,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async stream(
    file: UploadedImageFile | undefined,
    body: unknown,
    origin: string | undefined,
    reply: SseCapableReplyLike,
  ): Promise<void> {
    reply.hijack();
    const corsHeaders = buildStreamCorsHeaders(origin, this.config.corsAllowedOrigins);
    const sse = new SseWriter(reply.raw, corsHeaders);
    const heartbeat = setInterval(() => {
      sse.comment('keep-alive');
    }, STREAM_HEARTBEAT_INTERVAL_MS);
    sse.onClose(() => {
      clearInterval(heartbeat);
    });

    try {
      await this.analyzeGameStreamUseCase.analyze(file, body, (message) => {
        sse.event(message.event, message);
      });
    } catch (error: unknown) {
      const errorMessage = toStreamErrorMessage(error);
      sse.event(errorMessage.event, errorMessage);
    } finally {
      clearInterval(heartbeat);
      sse.close();
    }
  }
}
