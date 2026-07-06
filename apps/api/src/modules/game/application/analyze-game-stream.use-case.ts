import { Injectable } from '@nestjs/common';

import type { Traits } from '@twinzy/shared';
import { GameStreamEvent, GameStreamStage } from '@twinzy/shared';

import { TraitExtractionService } from '../../ai';
import {
  FileSecurityService,
  TemporaryFileCleanupService,
  type UploadedImageFile,
} from '../../file-security';
import { isConsentGiven } from '../lib/consent';
import type { GameStreamEmitter } from '../lib/game-stream';

import { StyleMatchService } from './style-match.service';

/**
 * The streaming counterpart of AnalyzeGameUseCase. It runs the identical
 * pipeline with the identical safety guarantees (image seen only by trait
 * extraction, buffer wiped in finally on success AND failure, text-only after
 * that) but reports each milestone through the emitter as it happens. The HTTP
 * layer turns those messages into SSE frames, so the long multi-step call
 * streams progress and never idles into a timeout.
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
  ): Promise<void> {
    emit({ event: GameStreamEvent.Accepted });
    emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.Validating });

    const traits = await this.extractTraitsAndDestroyImage(file, isConsentGiven(body), emit);

    const result = await this.styleMatch.matchFromTraits(traits, (stage) => {
      emit({ event: GameStreamEvent.Stage, stage });
    });

    emit({ event: GameStreamEvent.Result, result });
  }

  /**
   * The image lives exactly as long as this method: validated, sent to trait
   * extraction once, then zero-filled no matter what happened. Nothing
   * downstream of trait extraction ever receives the image.
   */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
    emit: GameStreamEmitter,
  ): Promise<Traits> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      emit({ event: GameStreamEvent.Stage, stage: GameStreamStage.ExtractingTraits });
      return await this.traitExtraction.extractTraits(safeFile.buffer, safeFile.mimetype);
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
