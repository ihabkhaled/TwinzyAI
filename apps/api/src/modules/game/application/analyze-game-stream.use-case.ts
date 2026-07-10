import { Injectable } from '@nestjs/common';

import type { LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';
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
 * Streaming counterpart of AnalyzeGameUseCase. The image is validated, sent
 * only to extraction, and wiped before text-only candidate generation/judging.
 * Progress is emitted as SSE-safe milestones throughout the remaining flow.
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

  /** Bounds image lifetime to validation + extraction, including abort paths. */
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
        buildAiImageInput(safeFile),
        languageCode,
        signal,
      );
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
