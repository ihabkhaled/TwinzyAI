import type {
  GameStreamStageValue,
  LanguageCodeValue,
  TraitExtractionResponse,
} from '@twinzy/shared';

import type { SseCapableReplyLike } from '../../../core/http/sse.types';
import type { StreamRequestMeta } from '../../../core/http/stream-meta.types';
import type { UploadedImageFile } from '../../file-security';
import type { PaymentHolder } from '../../payments';
import type { GameStreamEmitter } from '../lib/game-stream';

/** Optional progress sink so the streaming flow can report matching stages. */
type StyleMatchStageListener = (stage: GameStreamStageValue) => void;

/**
 * Everything one streaming analyze run threads through its private steps,
 * bundled so the pipeline methods stay within the parameter budget. The
 * `payment` holder is mutated in place when a capture succeeds so the outer
 * refund-on-failure handler can see it.
 */
export interface StreamAnalysisContext {
  readonly file: UploadedImageFile | undefined;
  readonly body: unknown;
  readonly emit: GameStreamEmitter;
  readonly requestId: string;
  readonly payment: PaymentHolder;
  readonly languageCode: LanguageCodeValue;
  readonly resultCount: number;
  readonly signal: AbortSignal | undefined;
}

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
interface StyleMatchProgressListener {
  onStage?: StyleMatchStageListener;
  onCandidates?: (names: readonly string[]) => void;
}

/**
 * Everything the text-only matching phase needs: written extraction evidence,
 * output language, requested count, optional progress sink, and cancel signal.
 * There is deliberately no image field.
 */
export interface StyleMatchInput {
  readonly extraction: TraitExtractionResponse;
  readonly languageCode: LanguageCodeValue;
  readonly resultCount: number;
  readonly progress?: StyleMatchProgressListener | undefined;
  readonly signal?: AbortSignal | undefined;
}
