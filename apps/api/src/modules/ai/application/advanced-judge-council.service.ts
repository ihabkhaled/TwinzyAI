import { Injectable } from '@nestjs/common';

import type { CandidateJudgeResponse, ModelCrossCritique } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { applyBackendConsensusScores } from '../lib/judge-consensus.mapper';
import type { JudgeCandidatesInput } from '../model/judge-input.types';
import type { MultiModelCouncilResult } from '../model/multi-model-council.types';

import { ConsensusFinalizerService } from './consensus-finalizer.service';
import { ConsensusScoringService } from './consensus-scoring.service';
import { CrossCritiqueService } from './cross-critique.service';
import { MultiModelCouncilService } from './multi-model-council.service';

@Injectable()
export class AdvancedJudgeCouncilService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly council: MultiModelCouncilService,
    private readonly crossCritique: CrossCritiqueService,
    private readonly finalizer: ConsensusFinalizerService,
    private readonly scoring: ConsensusScoringService,
  ) {}

  public run(prompt: string): Promise<readonly MultiModelCouncilResult[]> | undefined {
    const advanced = this.config.advancedMatching;
    if (!advanced.ensembleEnabled || advanced.judgeParticipants.length === 0) {
      return undefined;
    }
    return this.council.runTextCouncil({
      prompt,
      participants: advanced.judgeParticipants,
      minimumSuccessfulParticipants: advanced.minSuccessfulParticipants,
      timeoutMs: advanced.stepTimeoutMs,
    });
  }

  public async critique(
    input: JudgeCandidatesInput,
    judgeResponses: readonly CandidateJudgeResponse[],
  ): Promise<readonly ModelCrossCritique[]> {
    return this.crossCritique.critique({
      extraction: input.extraction,
      candidates: input.candidates,
      judgeResponses,
      languageCode: input.languageCode,
    });
  }

  public finalize(
    input: JudgeCandidatesInput,
    authoritative: CandidateJudgeResponse,
  ): Promise<CandidateJudgeResponse> {
    return this.finalizer.finalize(input, authoritative);
  }

  public score(
    input: JudgeCandidatesInput,
    responses: readonly CandidateJudgeResponse[],
    merged: CandidateJudgeResponse,
  ): CandidateJudgeResponse {
    return applyBackendConsensusScores(input, responses, merged, this.scoring);
  }
}
