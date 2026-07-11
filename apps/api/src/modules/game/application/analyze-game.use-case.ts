import { Injectable } from '@nestjs/common';

import type { FinalGameResult, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

import { buildAiImageInput, TraitExtractionService } from '../../ai';
import {
  FileSecurityService,
  TemporaryFileCleanupService,
  type UploadedImageFile,
} from '../../file-security';
import { PaymentGateService, type PaymentHolder } from '../../payments';
import { isConsentGiven } from '../lib/consent';
import { resolveRequestLanguage } from '../lib/request-language';
import { resolveRequestResultCount } from '../lib/request-result-count';

import { StyleMatchService } from './style-match.service';

/**
 * Owns the analyze sequence and its safety guarantees:
 * 1. consent + full file-security chain (fail-closed, ordered)
 * 2. payment capture when the paywall is configured (single-use at PayPal;
 *    an undelivered run after capture is refunded)
 * 3. trait extraction — the ONLY provider step that receives the photo
 * 4. the source buffer is zero-filled immediately after extraction
 * 5. text-only candidate generation, judging, and aggregation
 */
@Injectable()
export class AnalyzeGameUseCase {
  public constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly cleanup: TemporaryFileCleanupService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly styleMatch: StyleMatchService,
    private readonly paymentGate: PaymentGateService,
  ) {}

  public async analyze(
    file: UploadedImageFile | undefined,
    body: unknown,
  ): Promise<FinalGameResult> {
    const languageCode = resolveRequestLanguage(body);
    const resultCount = resolveRequestResultCount(body);
    const payment: PaymentHolder = { capture: undefined };
    try {
      const extraction = await this.extractTraitsAndDestroyImage(file, body, payment, languageCode);
      return await this.styleMatch.matchFromTraits({
        extraction,
        languageCode,
        resultCount,
      });
    } catch (error: unknown) {
      await this.paymentGate.refundOnFailure(payment.capture, error);
      throw error;
    }
  }

  /**
   * Bounds the image lifetime to validation + extraction. The source bytes are
   * wiped on success and every failure path before text-only matching starts.
   * Payment captures AFTER the cheap local file checks and BEFORE the AI call.
   */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    body: unknown,
    payment: PaymentHolder,
    languageCode: LanguageCodeValue,
  ): Promise<TraitExtractionResponse> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, isConsentGiven(body));
      payment.capture = await this.paymentGate.captureForAnalysis(body);
      return await this.traitExtraction.extractTraits(buildAiImageInput(safeFile), languageCode);
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
