import { HttpStatus, Injectable } from '@nestjs/common';

import type { Candidate, JudgedResult } from '@twinzy/shared';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { LoggerService } from '../../../infrastructure/logger/logger.service';
import { AI_UNSAFE_RESPONSE_MESSAGE } from '../constants/gemini.constants';
import { containsForbiddenWording, findForbiddenPhrase } from '../utils/forbidden-wording.guard';

const LOG_CONTEXT = 'AiSafety';

/**
 * Gatekeeper between raw model output and anything user-visible.
 * - Trait responses: any forbidden wording rejects the whole response.
 * - Candidate/judge items: offending items are dropped (sanitized); the
 *   pipeline falls back gracefully when nothing safe remains.
 */
@Injectable()
export class AiSafetyService {
  public constructor(private readonly logger: LoggerService) {}

  public assertTraitTextSafe(values: readonly string[]): void {
    for (const value of values) {
      if (containsForbiddenWording(value)) {
        this.logger.warn(
          LOG_CONTEXT,
          `Trait response rejected (matched: ${findForbiddenPhrase(value) ?? 'unknown'})`,
        );
        throw new DomainException(
          ErrorCode.AiResponseUnsafe,
          AI_UNSAFE_RESPONSE_MESSAGE,
          HttpStatus.BAD_GATEWAY,
        );
      }
    }
  }

  public filterCandidates(candidates: readonly Candidate[]): Candidate[] {
    return candidates.filter((candidate) => {
      const safe = this.isCandidateSafe(candidate);
      if (!safe) {
        this.logger.warn(LOG_CONTEXT, 'Dropped unsafe candidate');
      }
      return safe;
    });
  }

  public filterJudgedResults(results: readonly JudgedResult[]): JudgedResult[] {
    return results.filter((result) => {
      const safe = !containsForbiddenWording(this.judgedResultText(result));
      if (!safe) {
        this.logger.warn(LOG_CONTEXT, 'Dropped unsafe judged result');
      }
      return safe;
    });
  }

  private isCandidateSafe(candidate: Candidate): boolean {
    const combined = [
      candidate.name,
      candidate.reason,
      ...candidate.alignedTraits,
      ...candidate.weakOrUncertainTraits,
    ].join(' ');
    return !containsForbiddenWording(combined);
  }

  private judgedResultText(result: JudgedResult): string {
    return [
      result.name,
      result.reason,
      ...result.matchingTraits,
      ...result.weakOrUncertainTraits,
    ].join(' ');
  }
}
