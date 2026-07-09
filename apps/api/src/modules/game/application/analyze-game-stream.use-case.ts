import { Injectable } from '@nestjs/common';

import type { LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import { TraitExtractionService } from '../../ai';
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
 * The streaming counterpart of AnalyzeGameUseCase. It runs the identical
 * pipeline with the identical safety guarantees (image seen only by trait
 * extraction, buffer wiped in finally on success AND failure, text-only after
 * that) but reports each milestone through the emitter as it happens: the
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

    const extraction = await this.extractTraitsAndDestroyImage(
      file,
      isConsentGiven(body),
      languageCode,
      emit,
      signal,
    );
    emit({
      event: GameStreamEvent.Traits,
      traitCount: extraction.traitCount,
      compactTraitSummary: extraction.compactTraitSummary,
    });

    signal?.throwIfAborted();
    const result = await this.styleMatch.matchFromTraits(
      extraction,
      languageCode,
      resultCount,
      {
        onStage: (stage) => {
          emit({ event: GameStreamEvent.Stage, stage });
        },
        onCandidates: (names) => {
          emit({ event: GameStreamEvent.Candidates, resultCount, names: [...names] });
        },
      },
      signal,
    );

    emit({ event: GameStreamEvent.Result, result });
  }

  /**
   * The image lives exactly as long as this method: validated, sent to trait
   * extraction once, then zero-filled no matter what happened (including an
   * abort). Nothing downstream of trait extraction ever receives the image.
   */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
    languageCode: LanguageCodeValue,
    emit: GameStreamEmitter,
    signal?: AbortSignal,
  ): Promise<TraitExtractionResponse> {
    try {
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Scanning });
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      signal?.throwIfAborted();
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.ExtractingTraits });
      return await this.traitExtraction.extractTraits(
        safeFile.buffer,
        safeFile.mimetype,
        languageCode,
        signal,
      );
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
