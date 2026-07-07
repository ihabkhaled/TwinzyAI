import { Injectable } from '@nestjs/common';

import type { FinalGameResult, TranslateResultRequest } from '@twinzy/shared';

import { ResultTranslationService } from '../../ai';

/**
 * Language-switch use-case: localizes an EXISTING structured result without
 * ever touching the image pipeline — no file input exists on this path by
 * construction, and trait extraction / candidate generation / judging are
 * never invoked. Names, scores, ranks, and verdicts are preserved server-side
 * by the translation service.
 */
@Injectable()
export class TranslateResultUseCase {
  public constructor(private readonly resultTranslation: ResultTranslationService) {}

  public translate(request: TranslateResultRequest): Promise<FinalGameResult> {
    return this.resultTranslation.translateResult(request.result, request.targetLanguageCode);
  }
}
