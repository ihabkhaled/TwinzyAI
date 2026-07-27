import { z } from 'zod';

import {
  MAX_BIOGRAPHY_SUMMARY_LENGTH,
  MAX_CANDIDATE_CRITIQUES,
  MAX_CRITIQUE_SCORE_ADJUSTMENT,
  MAX_LOCALE_KEY_LENGTH,
  MAX_LOCALIZED_NAME_ITEMS,
  MAX_MATCHING_ID_LENGTH,
  MAX_MATCHING_SCORE,
  MAX_MATCHING_SIGNALS,
  MAX_MUTABLE_MATCHING_SIGNALS,
  MAX_NAME_LENGTH,
  MAX_PARTICIPANT_EVIDENCE_ITEMS,
  MAX_PRESENTATION_MATCHING_SIGNALS,
  MAX_PUBLIC_FIGURE_METADATA_ITEMS,
  MAX_PUBLIC_FIGURE_SOURCE_ITEMS,
  MAX_REASON_LENGTH,
  MAX_TRAIT_EVIDENCE_WEIGHT,
  MAX_TRAIT_REFERENCE_LENGTH,
  MIN_CRITIQUE_SCORE_ADJUSTMENT,
  MIN_LOCALE_KEY_LENGTH,
  MIN_MATCHING_SCORE,
} from '../constants/response-bounds.constants';
import {
  MATCHING_SIGNAL_CONFIDENCE_VALUES,
  MATCHING_SIGNAL_MODIFIER_VALUES,
  MATCHING_SIGNAL_VISIBILITY_VALUES,
} from '../enums/matching-signal.enum';
import { PUBLIC_FIGURE_SOURCE_VALUES } from '../enums/public-figure-source.enum';

const boundedTextSchema = z.string().trim().min(1).max(MAX_TRAIT_REFERENCE_LENGTH);
const scoreSchema = z.number().min(MIN_MATCHING_SCORE).max(MAX_MATCHING_SCORE);
const httpsUrlSchema = z.url().refine((url) => url.startsWith('https://'), {
  message: 'Only HTTPS URLs are accepted',
});
const metadataArraySchema = z.array(boundedTextSchema).max(MAX_PUBLIC_FIGURE_METADATA_ITEMS);
const evidenceIdArraySchema = z
  .array(z.string().trim().min(1).max(MAX_MATCHING_ID_LENGTH))
  .max(MAX_PARTICIPANT_EVIDENCE_ITEMS);

export const PublicFigureEntityIdSchema = z
  .string()
  .trim()
  .regex(/^Q[1-9]\d{0,18}$/u)
  .max(MAX_MATCHING_ID_LENGTH);

export const MatchingSignalSchema = z.strictObject({
  id: z.string().trim().min(1).max(MAX_MATCHING_ID_LENGTH),
  value: boundedTextSchema,
  confidence: z.enum(MATCHING_SIGNAL_CONFIDENCE_VALUES),
  weight: z.number().int().min(0).max(MAX_TRAIT_EVIDENCE_WEIGHT),
  visibility: z.enum(MATCHING_SIGNAL_VISIBILITY_VALUES),
  affectedBy: z
    .array(z.enum(MATCHING_SIGNAL_MODIFIER_VALUES))
    .max(MATCHING_SIGNAL_MODIFIER_VALUES.length),
});

export const QualitativeMatchingProfileSchema = z.strictObject({
  stableVisibleStructure: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
  mutableStyleSignals: z.array(MatchingSignalSchema).max(MAX_MUTABLE_MATCHING_SIGNALS),
  expressionAndPresentation: z.array(MatchingSignalSchema).max(MAX_PRESENTATION_MATCHING_SIGNALS),
  occludedOrUncertainSignals: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
  contradictionsToAvoid: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
  accessoryAgnosticSignals: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
  imageQualityCaps: z.array(boundedTextSchema).max(MAX_PUBLIC_FIGURE_SOURCE_ITEMS),
});

export const MatchingCounterfactualProfilesSchema = z.strictObject({
  withoutEyewear: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
  withoutFacialHair: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
  withoutMutableStyling: z.array(MatchingSignalSchema).max(MAX_MATCHING_SIGNALS),
});

export const PublicFigureSourceReferenceSchema = z.strictObject({
  source: z.enum(PUBLIC_FIGURE_SOURCE_VALUES),
  sourceId: z.string().trim().min(1).max(MAX_MATCHING_ID_LENGTH),
  url: httpsUrlSchema,
});

export const PublicFigureLookProfileSchema = z.strictObject({
  label: boundedTextSchema,
  stableTags: metadataArraySchema,
  mutableStyleTags: metadataArraySchema,
  facialHairStyle: boundedTextSchema.optional(),
  eyewearStyle: boundedTextSchema.optional(),
  hairstyle: boundedTextSchema.optional(),
});

export const PublicFigureProfileSchema = z.strictObject({
  entityId: PublicFigureEntityIdSchema,
  canonicalName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  aliases: metadataArraySchema,
  localizedNames: z
    .record(
      z.string().trim().min(MIN_LOCALE_KEY_LENGTH).max(MAX_LOCALE_KEY_LENGTH),
      z.string().trim().min(1).max(MAX_NAME_LENGTH),
    )
    .refine((names) => Object.keys(names).length <= MAX_LOCALIZED_NAME_ITEMS),
  countryOrRegion: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  publicCategories: metadataArraySchema,
  stableAppearanceTags: metadataArraySchema,
  mutableStyleTags: metadataArraySchema,
  presentationTags: metadataArraySchema,
  signatureLooks: z.array(PublicFigureLookProfileSchema).max(MAX_PUBLIC_FIGURE_SOURCE_ITEMS),
  sourceReferences: z
    .array(PublicFigureSourceReferenceSchema)
    .min(1)
    .max(MAX_PUBLIC_FIGURE_SOURCE_ITEMS),
});

export const ModelCandidateRankingSchema = z.strictObject({
  participantId: z.string().trim().min(1).max(MAX_MATCHING_ID_LENGTH),
  entityId: PublicFigureEntityIdSchema,
  supportedSignalIds: evidenceIdArraySchema,
  contradictedSignalIds: evidenceIdArraySchema,
  stableEvidenceScore: scoreSchema,
  mutableStyleScore: scoreSchema,
  presentationScore: scoreSchema,
  evidenceCoverage: scoreSchema,
});

export const ModelJudgeReportSchema = z.strictObject({
  participantId: z.string().trim().min(1).max(MAX_MATCHING_ID_LENGTH),
  entityId: PublicFigureEntityIdSchema,
  stableEvidenceScore: scoreSchema,
  mutableStyleScore: scoreSchema,
  expressionScore: scoreSchema,
  contradictionSeverity: scoreSchema,
  uncertaintyPenalty: scoreSchema,
  confidence: scoreSchema,
  supportedSignalIds: evidenceIdArraySchema,
  contradictedSignalIds: evidenceIdArraySchema,
  unsupportedClaims: z.array(boundedTextSchema).max(MAX_PARTICIPANT_EVIDENCE_ITEMS),
  shouldKeep: z.boolean(),
});

export const CandidateCritiqueSchema = z.strictObject({
  entityId: PublicFigureEntityIdSchema,
  unsupportedClaims: z.array(boundedTextSchema).max(MAX_PARTICIPANT_EVIDENCE_ITEMS),
  ignoredContradictionIds: evidenceIdArraySchema,
  accessoryBiasDetected: z.boolean(),
  scoreAdjustment: z.number().min(MIN_CRITIQUE_SCORE_ADJUSTMENT).max(MAX_CRITIQUE_SCORE_ADJUSTMENT),
  reason: z.string().trim().min(1).max(MAX_REASON_LENGTH),
});

export const ModelCrossCritiqueSchema = z.strictObject({
  reviewerParticipantId: z.string().trim().min(1).max(MAX_MATCHING_ID_LENGTH),
  critiques: z.array(CandidateCritiqueSchema).max(MAX_CANDIDATE_CRITIQUES),
  missingCoverage: z.array(boundedTextSchema).max(MAX_PARTICIPANT_EVIDENCE_ITEMS),
  requiresSecondRetrievalPass: z.boolean(),
  suggestedSearchTags: metadataArraySchema,
});

export const ConsensusCandidateSchema = z.strictObject({
  entityId: PublicFigureEntityIdSchema,
  finalScore: scoreSchema,
  confidence: scoreSchema,
  supportedSignalIds: evidenceIdArraySchema,
  contradictedSignalIds: evidenceIdArraySchema,
});

export const PublicFigureImageSchema = z.strictObject({
  thumbnailUrl: httpsUrlSchema,
  fullUrl: httpsUrlSchema,
  alt: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  author: boundedTextSchema.optional(),
  credit: boundedTextSchema.optional(),
  licenseName: boundedTextSchema.optional(),
  licenseUrl: httpsUrlSchema.optional(),
  sourcePageUrl: httpsUrlSchema,
});

export const PublicFigureEnrichmentSchema = z.strictObject({
  entityId: PublicFigureEntityIdSchema,
  canonicalName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  localizedName: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
  description: z.string().trim().min(1).max(MAX_REASON_LENGTH).optional(),
  biographySummary: z.string().trim().min(1).max(MAX_BIOGRAPHY_SUMMARY_LENGTH).optional(),
  occupations: metadataArraySchema,
  countryOrRegion: z.string().trim().min(1).max(MAX_NAME_LENGTH).optional(),
  wikipediaUrl: httpsUrlSchema.optional(),
  googleSearchUrl: httpsUrlSchema,
  image: PublicFigureImageSchema.optional(),
});

export type MatchingSignal = z.infer<typeof MatchingSignalSchema>;
export type QualitativeMatchingProfile = z.infer<typeof QualitativeMatchingProfileSchema>;
export type MatchingCounterfactualProfiles = z.infer<typeof MatchingCounterfactualProfilesSchema>;
export type PublicFigureProfile = z.infer<typeof PublicFigureProfileSchema>;
export type ModelCandidateRanking = z.infer<typeof ModelCandidateRankingSchema>;
export type ModelJudgeReport = z.infer<typeof ModelJudgeReportSchema>;
export type ModelCrossCritique = z.infer<typeof ModelCrossCritiqueSchema>;
export type ConsensusCandidate = z.infer<typeof ConsensusCandidateSchema>;
export type PublicFigureImage = z.infer<typeof PublicFigureImageSchema>;
export type PublicFigureEnrichment = z.infer<typeof PublicFigureEnrichmentSchema>;
