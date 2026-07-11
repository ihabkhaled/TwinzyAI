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
 * Payment (when configured) captures between file security and extraction, and
 * a failure after capture refunds the undelivered run. Progress is emitted as
 * SSE-safe milestones throughout the remaining flow.
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

    // The refund handler must see a capture made deeper in the flow, so the
    // payment travels in a per-run holder. Any failure AFTER capture — AI
    // error, timeout, disconnect, cancel — refunds the undelivered run.
    const context: StreamAnalysisContext = {
      file,
      body,
      emit,
      requestId,
      payment: { capture: undefined },
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

    emit({ event: GameStreamEvent.Result, result });
  }

  /**
   * Bounds image lifetime to validation + extraction, including abort paths.
   * Payment captures AFTER the cheap local file checks (no capture/refund
   * churn for invalid uploads) and BEFORE the expensive AI pipeline.
   */
  private async extractTraitsAndDestroyImage(
    context: StreamAnalysisContext,
  ): Promise<TraitExtractionResponse> {
    const { file, body, emit, requestId, payment, languageCode, signal } = context;
    try {
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Scanning });
      const safeFile = await this.fileSecurity.assertSafeImage(file, isConsentGiven(body));
      signal?.throwIfAborted();
      payment.capture = await this.paymentGate.captureForAnalysis(body, requestId);
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
