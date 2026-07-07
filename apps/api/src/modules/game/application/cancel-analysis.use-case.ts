import { Injectable } from '@nestjs/common';

import type { CancelAnalysisRequest, CancelAnalysisResponse } from '@twinzy/shared';

import { StreamRegistry } from '../../../core/streaming';

/**
 * Cancels an in-flight streaming analysis. Delegates the id-matching rule to the
 * registry, which aborts only when the stream/tab/request ids all match — so one
 * tab (or user) can never cancel another's run. A miss is a safe no-op.
 */
@Injectable()
export class CancelAnalysisUseCase {
  public constructor(private readonly registry: StreamRegistry) {}

  public cancel(request: CancelAnalysisRequest): CancelAnalysisResponse {
    const cancelled = this.registry.cancel({
      streamId: request.streamId,
      tabId: request.tabId,
      requestId: request.requestId,
    });
    return { cancelled };
  }
}
