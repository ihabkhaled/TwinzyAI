import type { FinalGameResult, LanguageCodeValue } from '@twinzy/shared';
import { GameStreamEvent, GameStreamMessageSchema, STREAM_ID_HEADERS } from '@twinzy/shared';

import { HttpError, streamMultipart } from '@/packages/axios';

import { isMatchingStreamFrame } from '../helpers/stream-frame.helper';
import { getTabId } from '../helpers/stream-identity.helper';
import { GAME_ANALYZE_STREAM_PATH } from '../model/game.constants';
import type { AnalyzeStreamOptions, GameStreamHandlers } from '../model/game.types';

import { buildAnalyzeFormData } from './game-form-data.builder';

/**
 * Streaming HTTP: opens the SSE analyze request tagged with this tab's + run's
 * correlation ids, validates each frame against the shared contract, drops any
 * frame that belongs to another run, forwards progress through `handlers`, and
 * resolves with the final result. The run's `signal` cancels the open
 * connection. A terminal `error` event becomes a shared {@link HttpError}
 * carrying the backend's stable errorCode on `responseBody`, so the caller maps
 * it to a friendly per-code message. Non-contract frames (heartbeats, accepted,
 * malformed data) are ignored.
 */
export const analyzeImageStreamRequest = async (
  file: File,
  languageCode: LanguageCodeValue,
  handlers: GameStreamHandlers,
  options: AnalyzeStreamOptions,
): Promise<FinalGameResult> => {
  let result: FinalGameResult | undefined;
  let streamError: HttpError | undefined;
  const tabId = getTabId();

  await streamMultipart(
    GAME_ANALYZE_STREAM_PATH,
    buildAnalyzeFormData(file, languageCode, options.resultCount),
    (data) => {
      const parsed = GameStreamMessageSchema.safeParse(parseJson(data));
      if (!parsed.success) {
        return;
      }
      const message = parsed.data;
      if (!isMatchingStreamFrame(message, tabId, options.requestId)) {
        return;
      }
      switch (message.event) {
        case GameStreamEvent.Stage: {
          handlers.onStage(message.stage);
          break;
        }
        case GameStreamEvent.Traits: {
          handlers.onTraits?.({
            traitCount: message.traitCount,
            compactTraitSummary: message.compactTraitSummary,
          });
          break;
        }
        case GameStreamEvent.Candidates: {
          handlers.onCandidates?.(message.names);
          break;
        }
        case GameStreamEvent.Result: {
          result = message.result;
          break;
        }
        case GameStreamEvent.Error: {
          streamError = new HttpError('http', message.message, null, {
            errorCode: message.errorCode,
            message: message.message,
            ...(message.stage !== undefined && { stage: message.stage }),
          });
          break;
        }
        default: {
          break;
        }
      }
    },
    {
      signal: options.signal,
      headers: {
        [STREAM_ID_HEADERS.tabId]: tabId,
        [STREAM_ID_HEADERS.requestId]: options.requestId,
      },
    },
  );

  if (streamError !== undefined) {
    throw streamError;
  }
  if (result === undefined) {
    throw new HttpError('unknown', 'Stream ended without a result', null, null);
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
