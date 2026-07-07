import type { GameStreamStageValue } from '@twinzy/shared';

import type { SseCapableReplyLike } from '../../../core/http/sse.types';
import type { StreamRequestMeta } from '../../../core/http/stream-meta.types';
import type { UploadedImageFile } from '../../file-security';

/** Optional progress sink so the streaming flow can report matching stages. */
export type StyleMatchStageListener = (stage: GameStreamStageValue) => void;

/** The resolved (always-present) tab + request correlation ids for one stream. */
export interface StreamCorrelationIds {
  readonly tabId: string;
  readonly requestId: string;
}

/**
 * Everything the transport layer hands the stream presenter for one run: the
 * upload, the raw multipart body, the hijack-capable reply, and the transport
 * metadata (origin, client IP, and correlation ids) resolved by @StreamMeta.
 */
export interface GameStreamRequest extends StreamRequestMeta {
  readonly file: UploadedImageFile | undefined;
  readonly body: unknown;
  readonly reply: SseCapableReplyLike;
}

/**
 * Progress sink for the text-only matching phase: stage milestones plus the
 * candidate public-figure names being considered ("rough examples"), reported
 * as they become available so the stream can render each step live.
 */
export interface StyleMatchProgressListener {
  onStage?: StyleMatchStageListener;
  onCandidates?: (names: readonly string[]) => void;
}
