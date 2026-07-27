import type {
  Candidate,
  CandidateJudgeResponse,
  LanguageCodeValue,
  TraitExtractionResponse,
} from '@twinzy/shared';

export interface CrossCritiqueInput {
  readonly extraction: TraitExtractionResponse;
  readonly candidates: readonly Candidate[];
  readonly judgeResponses: readonly CandidateJudgeResponse[];
  readonly languageCode: LanguageCodeValue;
}
