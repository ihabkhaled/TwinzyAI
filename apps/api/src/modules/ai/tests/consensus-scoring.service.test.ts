import { describe, expect, it } from 'vitest';

import type { ModelJudgeReport } from '@twinzy/shared';

import { ConsensusScoringService } from '../application/consensus-scoring.service';

const report = (
  participantId: string,
  stableEvidenceScore: number,
  overrides: Partial<ModelJudgeReport> = {},
): ModelJudgeReport => ({
  participantId,
  entityId: 'Q100',
  stableEvidenceScore,
  mutableStyleScore: 60,
  expressionScore: 70,
  contradictionSeverity: 0,
  uncertaintyPenalty: 0,
  confidence: 80,
  supportedSignalIds: ['eyes.spacing'],
  contradictedSignalIds: [],
  unsupportedClaims: [],
  shouldKeep: true,
  ...overrides,
});

describe('ConsensusScoringService', () => {
  const service = new ConsensusScoringService();

  it('uses the participant median so one exaggerated model cannot dominate', () => {
    const result = service.score({
      entityId: 'Q100',
      reports: [report('gpt:model', 100), report('gemini:model', 60), report('deepseek:model', 62)],
      retrievalScore: 0,
      crossLaneCount: 1,
      qualityCapCount: 0,
    });

    expect(result.finalScore).toBeLessThan(75);
    expect(result.finalScore).toBeGreaterThanOrEqual(60);
  });

  it('subtracts contradiction, uncertainty, unsupported-claim, and quality penalties', () => {
    const clean = service.score({
      entityId: 'Q100',
      reports: [report('gpt:model', 80), report('gemini:model', 80)],
      retrievalScore: 10,
      crossLaneCount: 3,
      qualityCapCount: 0,
    });
    const penalized = service.score({
      entityId: 'Q100',
      reports: [
        report('gpt:model', 80, {
          contradictionSeverity: 40,
          uncertaintyPenalty: 20,
          contradictedSignalIds: ['jaw.shape'],
          unsupportedClaims: ['unsupported'],
        }),
        report('gemini:model', 80, {
          contradictionSeverity: 40,
          uncertaintyPenalty: 20,
          contradictedSignalIds: ['jaw.shape'],
          unsupportedClaims: ['unsupported'],
        }),
      ],
      retrievalScore: 10,
      crossLaneCount: 3,
      qualityCapCount: 2,
    });

    expect(penalized.finalScore).toBeLessThan(clean.finalScore);
    expect(penalized.contradictedSignalIds).toEqual(['jaw.shape']);
  });

  it('rejects unresolved candidates and requires at least two successful reports', () => {
    expect(() =>
      service.score({
        entityId: 'unresolved',
        reports: [report('gpt:model', 80), report('gemini:model', 80)],
        retrievalScore: 0,
        crossLaneCount: 1,
        qualityCapCount: 0,
      }),
    ).toThrow('verified entity');

    expect(() =>
      service.score({
        entityId: 'Q100',
        reports: [report('gpt:model', 80)],
        retrievalScore: 0,
        crossLaneCount: 1,
        qualityCapCount: 0,
      }),
    ).toThrow('successful participant');
  });
});
