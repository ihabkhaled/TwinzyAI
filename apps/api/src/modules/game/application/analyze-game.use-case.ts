import { Injectable } from '@nestjs/common';

import type { FinalGameResult, Traits } from '@twinzy/shared';

import { TraitExtractionService } from '../../ai';
import {
  FileSecurityService,
  TemporaryFileCleanupService,
  type UploadedImageFile,
} from '../../file-security';
import { isConsentGiven } from '../lib/consent';

import { StyleMatchService } from './style-match.service';

/**
 * Owns the analyze use-case sequence and its safety guarantees:
 * 1. consent + full file-security chain (fail-closed, ordered)
 * 2. trait extraction — the ONLY step that sees the image
 * 3. image buffer destroyed in finally (success AND failure)
 * 4. text-only matching (candidates → judge → aggregation) once the image
 *    is already gone, delegated to the StyleMatchService
 */
@Injectable()
export class AnalyzeGameUseCase {
  public constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly cleanup: TemporaryFileCleanupService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly styleMatch: StyleMatchService,
  ) {}

  public async analyze(
    file: UploadedImageFile | undefined,
    body: unknown,
  ): Promise<FinalGameResult> {
    const traits = await this.extractTraitsAndDestroyImage(file, isConsentGiven(body));
    return this.styleMatch.matchFromTraits(traits);
  }

  /**
   * The image lives exactly as long as this method: validated, sent to trait
   * extraction once, then zero-filled no matter what happened — success or
   * failure. Nothing downstream of trait extraction ever receives the image.
   */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
  ): Promise<Traits> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      return await this.traitExtraction.extractTraits(safeFile.buffer, safeFile.mimetype);
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
