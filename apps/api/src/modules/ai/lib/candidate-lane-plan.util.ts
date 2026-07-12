import {
  CANDIDATE_GENERATION_LANE_ORDER,
  CandidateGenerationFocus,
  LANE_FOCUS_DIRECTIVE,
  LANE_FOCUS_SAFETY_REMINDER,
  LANE_FOCUS_SECTION_HEADING,
} from '../model/candidate-lane.constants';
import type { CandidateGenerationLane } from '../model/candidate-lane.types';

/**
 * Plan `count` recall lanes, rotating through the focus order (strongest,
 * diverse, wildcard, then cycling). Always returns at least one lane so a
 * mis-set count can never produce an empty fan-out.
 */
export const buildCandidateGenerationLanes = (count: number): CandidateGenerationLane[] => {
  const total = Math.max(1, Math.floor(count));
  return Array.from({ length: total }, (_unused, index) => {
    const focus =
      CANDIDATE_GENERATION_LANE_ORDER[index % CANDIDATE_GENERATION_LANE_ORDER.length] ??
      CandidateGenerationFocus.Strongest;
    return { id: `lane-${index + 1}-${focus}`, focus };
  });
};

/**
 * The text-only focus section appended to the base generation prompt for a
 * lane. Kept out of the shared base template so the single-call (flag-off) path
 * stays byte-for-byte unchanged; only a lane call appends this section.
 */
export const buildLaneFocusSection = (lane: CandidateGenerationLane): string =>
  `\n\n${LANE_FOCUS_SECTION_HEADING}\n\n${LANE_FOCUS_DIRECTIVE[lane.focus]}\n\n${LANE_FOCUS_SAFETY_REMINDER}\n`;
