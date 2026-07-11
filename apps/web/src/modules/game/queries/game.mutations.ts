import type { LanguageCodeValue } from '@twinzy/shared';

import { useAppMutation } from '@/packages/query';

import type {
  AnalyzeGameMutation,
  AnalyzeRunInput,
  GameStreamHandlers,
  TranslateResultInput,
  TranslateResultMutation,
} from '../model/game.types';
import { analyzeImageStream, translateResult } from '../services/game.service';

import { GAME_MUTATION_KEY, TRANSLATE_MUTATION_KEY } from './game-query-keys';

/**
 * Binds the streaming analyze service to the query cache and exposes a narrowed
 * surface (data/error/status + `analyze`/`reset`) so the orchestrator hook never
 * depends on the underlying query vendor's mutation type. Pipeline stages and
 * intermediate payloads (traits, candidates) are reported through `handlers`
 * while the mutation is pending; all dynamic AI output is requested in
 * `languageCode`.
 */
export const useAnalyzeGameMutation = (
  handlers: GameStreamHandlers,
  languageCode: LanguageCodeValue,
): AnalyzeGameMutation => {
  const mutation = useAppMutation({
    mutationKey: GAME_MUTATION_KEY,
    mutationFn: (input: AnalyzeRunInput) =>
      analyzeImageStream(input.file, languageCode, handlers, {
        requestId: input.requestId,
        signal: input.signal,
        resultCount: input.resultCount,
        ...(input.paypalOrderId !== undefined && { paypalOrderId: input.paypalOrderId }),
      }),
  });

  return {
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    analyze: mutation.mutate,
    reset: mutation.reset,
  };
};

/**
 * Binds the language-switch translation service to the query cache. The image
 * pipeline is untouched by design: this mutation only ever posts the existing
 * structured result JSON.
 */
export const useTranslateResultMutation = (): TranslateResultMutation => {
  const mutation = useAppMutation({
    mutationKey: TRANSLATE_MUTATION_KEY,
    mutationFn: (input: TranslateResultInput) =>
      translateResult(input.result, input.targetLanguageCode),
  });

  return {
    isPending: mutation.isPending,
    isError: mutation.isError,
    translate: (input, callbacks): void => {
      mutation.mutate(input, callbacks);
    },
    reset: mutation.reset,
  };
};
