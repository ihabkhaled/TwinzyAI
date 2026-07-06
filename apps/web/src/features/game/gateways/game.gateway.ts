import type { FinalGameResult } from '@twinzy/shared';
import { GameStreamEvent, GameStreamMessageSchema } from '@twinzy/shared';

import {
  HttpClientError,
  INVALID_RESPONSE_CODE,
  postMultipart,
  postMultipartStream,
} from '@/lib/http';

import { GAME_ANALYZE_PATH, GAME_ANALYZE_STREAM_PATH } from '../model/game.constants';
import { FinalGameResultSchema } from '../model/game.schemas';
import type { GameStreamHandlers } from '../model/game.types';

const UPLOAD_FIELD = 'image';

const CONSENT_FIELD = 'consent';

const buildFormData = (file: File): FormData => {
  const formData = new FormData();
  formData.append(UPLOAD_FIELD, file, file.name);
  formData.append(CONSENT_FIELD, 'true');
  return formData;
};

/**
 * HTTP only: builds the multipart request and validates the response
 * shape. No business decisions live here.
 */
export const analyzeImageRequest = async (file: File): Promise<FinalGameResult> =>
  postMultipart(GAME_ANALYZE_PATH, buildFormData(file), FinalGameResultSchema);

/**
 * Streaming HTTP: opens the SSE analyze request, validates each frame against
 * the shared contract, forwards stage progress, and resolves with the final
 * result. A terminal `error` event becomes a typed HttpClientError carrying the
 * backend's stable errorCode, so the caller maps it to a friendly message.
 */
export const analyzeImageStreamRequest = async (
  file: File,
  handlers: GameStreamHandlers,
): Promise<FinalGameResult> => {
  let result: FinalGameResult | undefined;
  let streamError: HttpClientError | undefined;

  await postMultipartStream(GAME_ANALYZE_STREAM_PATH, buildFormData(file), (data) => {
    const parsed = GameStreamMessageSchema.safeParse(parseJson(data));
    if (!parsed.success) {
      return;
    }
    const message = parsed.data;
    switch (message.event) {
      case GameStreamEvent.Stage: {
        handlers.onStage(message.stage);
        break;
      }
      case GameStreamEvent.Result: {
        result = message.result;
        break;
      }
      case GameStreamEvent.Error: {
        streamError = new HttpClientError(0, message.errorCode, message.message);
        break;
      }
      default: {
        break;
      }
    }
  });

  if (streamError !== undefined) {
    throw streamError;
  }
  if (result === undefined) {
    throw new HttpClientError(0, INVALID_RESPONSE_CODE, 'Stream ended without a result');
  }
  return result;
};

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};
