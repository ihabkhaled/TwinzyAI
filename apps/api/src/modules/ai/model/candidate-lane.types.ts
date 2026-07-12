import type { CandidateGenerationFocusValue } from './candidate-lane.constants';

/**
 * One text-only candidate-recall lane. `focus` biases HOW the lane sweeps for
 * public figures (strongest / diverse / wildcard); it never relaxes safety,
 * trait-support, or the JSON contract — those live in the base prompt and
 * apply to every lane. There is deliberately no image field.
 */
export interface CandidateGenerationLane {
  /** Stable id for logging/observability, e.g. `lane-1-strongest`. */
  readonly id: string;
  readonly focus: CandidateGenerationFocusValue;
}
