import { Injectable } from '@nestjs/common';

import type { FinalGameResult, LanguageCodeValue, TraitExtractionResponse } from '@twinzy/shared';

import { buildAiImageInput, TraitExtractionService } from '../../ai';
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
 * Owns the analyze sequence and its safety guarantees:
 * 1. consent + full file-security chain (fail-closed, ordered)
 * 2. trait extraction — the ONLY provider step that receives the photo
 * 3. the source buffer is zero-filled immediately after extraction
 * 4. text-only candidate generation, judging, and aggregation
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
    return this.styleMatch.matchFromTraits({
      extraction,
      languageCode,
      resultCount,
    });
  }

  /**
   * Bounds the image lifetime to validation + extraction. The source bytes are
   * wiped on success and every failure path before text-only matching starts.
   */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
    languageCode: LanguageCodeValue,
  ): Promise<TraitExtractionResponse> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      return await this.traitExtraction.extractTraits(buildAiImageInput(safeFile), languageCode);
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
