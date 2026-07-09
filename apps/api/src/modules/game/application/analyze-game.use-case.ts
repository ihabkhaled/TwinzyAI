import { Injectable } from '@nestjs/common';

import type { FinalGameResult } from '@twinzy/shared';

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
 * Owns the analyze use-case sequence and its safety guarantees
 * (visual-similarity mode):
 * 1. consent + full file-security chain (fail-closed, ordered)
 * 2. the photo is encoded ONCE and provided to extraction, candidate
 *    generation, and judging (multimodal resemblance matching)
 * 3. the image buffer lives exactly as long as the pipeline: zero-filled in
 *    finally on success AND failure — never logged, stored, or returned
 * 4. results are localized to the request's language
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
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, isConsentGiven(body));
      const image = buildAiImageInput(safeFile);
      const extraction = await this.traitExtraction.extractTraits(image, languageCode);
      return await this.styleMatch.matchFromTraits({
        extraction,
        image,
        languageCode,
        resultCount,
      });
    } finally {
      this.cleanup.wipe(file);
    }
  }
}
