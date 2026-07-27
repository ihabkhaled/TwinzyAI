import { Injectable } from '@nestjs/common';

import { calculateConsensusScore } from '../lib/consensus-scoring.util';
import {
  CONSENSUS_ENTITY_ID_PATTERN,
  CONSENSUS_MIN_REPORTS,
} from '../model/consensus-scoring.constants';
import type {
  ConsensusScoringInput,
  ConsensusScoringResult,
} from '../model/consensus-scoring.types';

@Injectable()
export class ConsensusScoringService {
  public score(input: ConsensusScoringInput): ConsensusScoringResult {
    if (!CONSENSUS_ENTITY_ID_PATTERN.test(input.entityId)) {
      throw new Error('Consensus scoring requires a verified entity');
    }
    if (input.reports.length < CONSENSUS_MIN_REPORTS) {
      throw new Error('Consensus scoring requires at least two successful participant reports');
    }
    return calculateConsensusScore(input);
  }
}
