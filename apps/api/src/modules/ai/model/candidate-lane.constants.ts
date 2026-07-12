/**
 * Recall focuses for parallel candidate-generation lanes. Each lane sweeps the
 * same written evidence with a different emphasis so the merged pool is richer
 * than a single call — WITHOUT ever changing what a candidate must satisfy
 * (safety rails, ≥3 concrete trait agreements, JSON contract) which the base
 * prompt owns for every lane.
 */
export const CandidateGenerationFocus = {
  Strongest: 'strongest',
  Diverse: 'diverse',
  Wildcard: 'wildcard',
} as const;

export type CandidateGenerationFocusValue =
  (typeof CandidateGenerationFocus)[keyof typeof CandidateGenerationFocus];

/**
 * Rotation order used to plan lanes: lane 1 = strongest, lane 2 = diverse,
 * lane 3 = wildcard, then it cycles. Two lanes (the Release-A default) yields
 * the strongest + diverse pair — the two most useful, least-overlapping sweeps.
 */
export const CANDIDATE_GENERATION_LANE_ORDER = [
  CandidateGenerationFocus.Strongest,
  CandidateGenerationFocus.Diverse,
  CandidateGenerationFocus.Wildcard,
] as const;

/**
 * Text appended (text-only) to the base generation prompt for each focus. A
 * recall BIAS only: it explicitly reaffirms that every safety rule and
 * trait-support requirement in the base prompt still applies unchanged.
 */
export const LANE_FOCUS_DIRECTIVE: Record<CandidateGenerationFocusValue, string> = {
  [CandidateGenerationFocus.Strongest]:
    'Prioritize the STRONGEST, most defensible matches: the public figures with the highest written-trait support and clearest high-confidence resemblance. Still sweep every pool, but rank the obvious strong matches first.',
  [CandidateGenerationFocus.Diverse]:
    'Prioritize DIVERSE coverage: deliberately widen the sweep across different regions, industries, eras, and public categories so the pool is not dominated by one obvious cluster — while still requiring genuine written-trait support for every candidate.',
  [CandidateGenerationFocus.Wildcard]:
    'Prioritize STYLE/ARCHETYPE wildcards: surface less-obvious public figures whose overall style/vibe archetype still matches the written evidence, to widen recall — never lowering the safety or trait-support bar.',
};

/** Heading for the appended focus section (kept out of the shared base prompt). */
export const LANE_FOCUS_SECTION_HEADING = '## Lane focus (recall variation)';

/**
 * Reaffirmation line that closes every focus section: the focus changes recall
 * emphasis only; the base prompt's rules remain authoritative.
 */
export const LANE_FOCUS_SAFETY_REMINDER =
  'This is a recall emphasis only. Every safety rule, trait-support requirement, scoring rubric, language rule, and JSON contract above still applies unchanged.';

/**
 * Provider calls an analysis makes OUTSIDE candidate generation: one trait
 * extraction plus one judge. Subtracted from AI_MAX_CALLS_PER_ANALYSIS to bound
 * how many generation lanes the per-analysis budget can afford.
 */
export const RESERVED_NON_GENERATION_CALLS = 2;
