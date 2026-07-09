import { Injectable } from '@nestjs/common';

import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import { buildAiImageInput, TraitExtractionService } from '../../ai';
import {
  FileSecurityService,
  TemporaryFileCleanupService,
  type UploadedImageFile,
} from '../../file-security';
import { isConsentGiven } from '../lib/consent';
import type { GameStreamEmitter } from '../lib/game-stream';
import { resolveRequestLanguage } from '../lib/request-language';
import { resolveRequestResultCount } from '../lib/request-result-count';

import { StyleMatchService } from './style-match.service';

/**
 * The streaming counterpart of AnalyzeGameUseCase (visual-similarity mode). It
 * runs the identical pipeline with the identical safety guarantees — the photo
 * is encoded once and provided to extraction, candidate generation, and
 * judging; the buffer is zero-filled in finally on success, failure, AND abort
 * — while reporting each milestone through the emitter as it happens: the
 * scanning/extraction stages, the trait count + compact summary, the candidate
 * names, and the final localized result. The HTTP layer turns those messages
 * into SSE frames, so the long multi-step call streams progress and never
 * idles into a timeout.
 */
@Injectable()
export class AnalyzeGameStreamUseCase {
  public constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly cleanup: TemporaryFileCleanupService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly styleMatch: StyleMatchService,
  ) {}

  public async analyze(
    file: UploadedImageFile | undefined,
    body: unknown,
    emit: GameStreamEmitter,
    signal?: AbortSignal,
  ): Promise<void> {
    const languageCode = resolveRequestLanguage(body);
    const resultCount = resolveRequestResultCount(body);
    emit({ event: GameStreamEvent.Accepted });
    emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Validating });

    try {
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Scanning });
      const safeFile = await this.fileSecurity.assertSafeImage(file, isConsentGiven(body));
      signal?.throwIfAborted();
      const image = buildAiImageInput(safeFile);

      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.ExtractingTraits });
      const extraction = await this.traitExtraction.extractTraits(image, languageCode, signal);
      emit({
        event: GameStreamEvent.Traits,
        traitCount: extraction.traitCount,
        compactTraitSummary: extraction.compactTraitSummary,
      });

      signal?.throwIfAborted();
      const result = await this.styleMatch.matchFromTraits({
        extraction,
        image,
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
    } finally {
      // The image lives exactly as long as the pipeline: zero-filled no matter
      // what happened — success, failure, or cancellation mid-judge.
      this.cleanup.wipe(file);
    }
  }
}
