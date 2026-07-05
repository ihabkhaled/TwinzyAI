import { Injectable } from '@nestjs/common';

import type { FinalGameResult, Traits } from '@twinzy/shared';

import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { CandidateGenerationService } from '../../ai/services/candidate-generation.service';
import { CandidateJudgeService } from '../../ai/services/candidate-judge.service';
import { TraitExtractionService } from '../../ai/services/trait-extraction.service';
import { FileSecurityService } from '../../file-security/services/file-security.service';
import { TemporaryFileCleanupService } from '../../file-security/services/temporary-file-cleanup.service';
import type { UploadedImageFile } from '../../file-security/types/upload-file.types';
import { ResultAggregationService } from '../../result-aggregation/services/result-aggregation.service';
import { isConsentGiven } from '../dto/analyze-request.dto';

const LOG_CONTEXT = 'GameManager';

/**
 * Owns the analyze use-case sequence and its safety guarantees:
 * 1. full file-security chain (consent first)
 * 2. trait extraction — the ONLY step that sees the image
 * 3. image buffer destroyed in finally (success AND failure)
 * 4. text-only candidate generation
 * 5. text-only judge pass
 * 6. safe aggregation with enforced disclaimer
 */
@Injectable()
export class GameManager {
  public constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly cleanup: TemporaryFileCleanupService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly candidateGeneration: CandidateGenerationService,
    private readonly candidateJudge: CandidateJudgeService,
    private readonly resultAggregation: ResultAggregationService,
    private readonly logger: LoggerService,
  ) {}

  public async analyze(file: UploadedImageFile | undefined, body: unknown): Promise<FinalGameResult> {
    const traits = await this.extractTraitsAndDestroyImage(file, isConsentGiven(body));

    const candidates = await this.candidateGeneration.generateCandidates(traits);
    if (candidates.length === 0) {
      this.logger.warn(LOG_CONTEXT, 'No safe candidates — returning fallback');
      return this.resultAggregation.buildFallback(traits);
    }

    const judged = await this.candidateJudge.judgeCandidates(traits, candidates);
    return this.resultAggregation.aggregate(traits, judged);
  }

  /**
   * The image lives exactly as long as this method: validated, sent to
   * trait extraction once, then zero-filled no matter what happened.
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
