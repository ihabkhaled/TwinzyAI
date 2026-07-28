import { Injectable } from '@nestjs/common';

import type { Candidate, JudgedResult } from '@twinzy/shared';

import { ERROR_MESSAGE_KEY_BY_CODE, ErrorCode, IntegrationError } from '../../../core/errors';
import { AppLogger } from '../../../core/logger/app-logger.service';
import { containsForbiddenWording, findForbiddenPhrase } from '../lib/forbidden-wording.guard';
import type { AiValidationResult } from '../model/ai-provider-adapter.types';
import { AI_UNSAFE_RESPONSE_MESSAGE } from '../model/gemini.constants';

const LOG_CONTEXT = 'AiSafety';

/**
 * Gatekeeper between raw model output and anything user-visible.
 * - Trait responses: any forbidden wording rejects the whole response.
 * - Candidate/judge items: offending items are dropped (sanitized); the
 *   pipeline falls back gracefully when nothing safe remains.
 */
@Injectable()
export class AiSafetyService {
  public constructor(private readonly logger: AppLogger) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public assertTraitTextSafe(values: readonly string[]): void {
    const validation = this.validateTraitText(values);
    if (!validation.ok) {
      const matched = validation.reason?.replace('forbidden wording: ', '') ?? 'unknown';
      this.logger.warn(`Trait response rejected (matched: ${matched})`);
      throw new IntegrationError(
        AI_UNSAFE_RESPONSE_MESSAGE,
        ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.AiResponseUnsafe],
        ErrorCode.AiResponseUnsafe,
      );
    }
  }

  public validateTraitText(values: readonly string[]): AiValidationResult {
    for (const value of values) {
      if (containsForbiddenWording(value)) {
        return {
          ok: false,
          reason: `forbidden wording: ${findForbiddenPhrase(value) ?? 'unknown'}`,
        };
      }
    }
    return { ok: true };
  }

  public filterCandidates(candidates: readonly Candidate[]): Candidate[] {
    return candidates.filter((candidate) => {
      const safe = this.isCandidateSafe(candidate);
      if (!safe) {
        this.logger.warn('Dropped unsafe candidate');
      }
      return safe;
    });
  }

  public filterJudgedResults(results: readonly JudgedResult[]): JudgedResult[] {
    return results.filter((result) => {
      const safe = !containsForbiddenWording(this.judgedResultText(result));
      if (!safe) {
        this.logger.warn('Dropped unsafe judged result');
      }
      return safe;
    });
  }

  private isCandidateSafe(candidate: Candidate): boolean {
    const combined = [
      candidate.name,
      candidate.countryOrRegion,
      candidate.reason,
      candidate.whyThisCandidateWasChosen,
      candidate.scoreExplanation,
      ...candidate.strongAlignedTraits,
      ...candidate.mediumAlignedTraits,
      ...candidate.weakOrUncertainTraits,
      ...candidate.majorMismatchRisks,
    ].join(' ');
    return !containsForbiddenWording(combined);
  }

  private judgedResultText(result: JudgedResult): string {
    return [
      result.name,
      result.countryOrRegion,
      result.finalReason,
      result.judgeNotes,
      ...result.topMatchingTraits,
      ...result.secondaryMatchingTraits,
      ...result.weakOrUncertainTraits,
      ...result.mismatchWarnings,
    ].join(' ');
  }
}
