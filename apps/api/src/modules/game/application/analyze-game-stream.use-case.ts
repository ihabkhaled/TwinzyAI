import { Injectable } from '@nestjs/common';

import type { TraitExtractionResponse } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import { buildAiImageInput, TraitExtractionService } from '../../ai';
import {
  FileSecurityService,
  TemporaryFileCleanupService,
  type UploadedImageFile,
} from '../../file-security';
import { PaymentGateService } from '../../payments';
import { isConsentGiven } from '../lib/consent';
import type { GameStreamEmitter } from '../lib/game-stream';
import { resolveRequestLanguage } from '../lib/request-language';
import { resolveRequestResultCount } from '../lib/request-result-count';
import type { StreamAnalysisContext } from '../model/game-stream.types';

import { StyleMatchService } from './style-match.service';

/**
 * Streaming counterpart of AnalyzeGameUseCase. The image is validated, sent
 * only to extraction, and wiped before text-only candidate generation/judging.
 * Payment is proven between file security and extraction. PayPal captures only
 * after the complete result exists; a later delivery failure refunds it.
 */
@Injectable()
export class AnalyzeGameStreamUseCase {
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
    emit: GameStreamEmitter,
    requestId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    emit({ event: GameStreamEvent.Accepted });
    emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Validating });

    // The refund handler must see money moved deeper in the flow, so payment
    // state travels in a per-run holder. Paymob is refundable throughout AI;
    // PayPal becomes refundable only after result-ready capture.
    const context: StreamAnalysisContext = {
      file,
      body,
      emit,
      requestId,
      payment: { prepared: undefined, capture: undefined },
      languageCode: resolveRequestLanguage(body),
      resultCount: resolveRequestResultCount(body),
      signal,
    };
    try {
      await this.runPaidAnalysis(context);
    } catch (error: unknown) {
      await this.paymentGate.refundOnFailure(context.payment.capture, error);
      throw error;
    }
  }

  private async runPaidAnalysis(context: StreamAnalysisContext): Promise<void> {
    const { emit, languageCode, resultCount, signal } = context;
    const extraction = await this.extractTraitsAndDestroyImage(context);
    emit({
      event: GameStreamEvent.Traits,
      traitCount: extraction.traitCount,
      compactTraitSummary: extraction.compactTraitSummary,
    });

    signal?.throwIfAborted();
    const result = await this.styleMatch.matchFromTraits({
      extraction,
      languageCode,
      resultCount,
      progress: {
        onStage: (stage) => {
          emit({ event: GameStreamEvent.Stage, stage });
        },
        onCandidates: (names) => {
          emit({ event: GameStreamEvent.Candidates, resultCount, names: [...names] });
        },
      },
      signal,
    });

    signal?.throwIfAborted();
    context.payment.capture = await this.paymentGate.finalizeForDelivery(context.payment.prepared);
    signal?.throwIfAborted();
    emit({ event: GameStreamEvent.Result, result });
  }

  /**
   * Bounds image lifetime to validation + extraction, including abort paths.
   * Payment is proven after cheap local file checks. PayPal remains approved
   * but uncaptured while the expensive AI pipeline runs.
   */
  private async extractTraitsAndDestroyImage(
    context: StreamAnalysisContext,
  ): Promise<TraitExtractionResponse> {
    const { file, body, emit, requestId, payment, languageCode, signal } = context;
    try {
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Scanning });
      const safeFile = await this.fileSecurity.assertSafeImage(file, isConsentGiven(body));
      signal?.throwIfAborted();
      payment.prepared = await this.paymentGate.prepareForAnalysis(body, requestId);
      payment.capture = this.paymentGate.refundableCaptureFor(payment.prepared);
      signal?.throwIfAborted();
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.ExtractingTraits });
      return await this.traitExtraction.extractTraits(
        buildAiImageInput(safeFile),
        languageCode,
        signal,
      );
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
