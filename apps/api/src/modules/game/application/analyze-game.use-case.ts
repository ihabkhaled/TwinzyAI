import { Injectable } from '@nestjs/common';

import type { FinalGameResult, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

import { TraitExtractionService } from '../../ai';
import {
  FileSecurityService,
  TemporaryFileCleanupService,
  type UploadedImageFile,
} from '../../file-security';
import { isConsentGiven } from '../lib/consent';
import { resolveRequestLanguage } from '../lib/request-language';
import { resolveRequestResultCount } from '../lib/request-result-count';

import { StyleMatchService } from './style-match.service';

/**
 * Owns the analyze use-case sequence and its safety guarantees:
 * 1. consent + full file-security chain (fail-closed, ordered)
 * 2. trait extraction — the ONLY step that sees the image
 * 3. image buffer destroyed in finally (success AND failure)
 * 4. text-only matching (candidates → judge → aggregation) once the image
 *    is already gone, delegated to the StyleMatchService — all localized to
 *    the request's language
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
    const languageCode = resolveRequestLanguage(body);
    const resultCount = resolveRequestResultCount(body);
    const extraction = await this.extractTraitsAndDestroyImage(
      file,
      isConsentGiven(body),
      languageCode,
    );
    return this.styleMatch.matchFromTraits(extraction, languageCode, resultCount);
  }

  /**
   * The image lives exactly as long as this method: validated, sent to trait
   * extraction once, then zero-filled no matter what happened — success or
   * failure. Nothing downstream of trait extraction ever receives the image.
   */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
    languageCode: LanguageCodeValue,
  ): Promise<TraitExtractionResponse> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      return await this.traitExtraction.extractTraits(
        safeFile.buffer,
        safeFile.mimetype,
        languageCode,
      );
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
