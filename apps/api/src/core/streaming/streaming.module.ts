import { Module } from '@nestjs/common';

import { ConcurrencyLimiter } from './concurrency-limiter.service';
import { StreamRegistry } from './stream-registry.service';

/**
 * Provides the in-memory admission control (ConcurrencyLimiter) and per-stream
 * cancellation registry (StreamRegistry) for the streaming analyze pipeline.
 * Imported by the feature module that owns the streaming endpoint.
 */
@Module({
  providers: [ConcurrencyLimiter, StreamRegistry],
  exports: [ConcurrencyLimiter, StreamRegistry],
})
export class StreamingModule {}
