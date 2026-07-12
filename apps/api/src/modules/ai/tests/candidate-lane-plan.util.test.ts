import { describe, expect, it } from 'vitest';

import {
  buildCandidateGenerationLanes,
  buildLaneFocusSection,
} from '../lib/candidate-lane-plan.util';
import {
  CandidateGenerationFocus,
  LANE_FOCUS_DIRECTIVE,
  LANE_FOCUS_SAFETY_REMINDER,
  LANE_FOCUS_SECTION_HEADING,
} from '../model/candidate-lane.constants';

describe('buildCandidateGenerationLanes', () => {
  it('plans the strongest + diverse pair for the default two lanes', () => {
    const lanes = buildCandidateGenerationLanes(2);
    expect(lanes).toEqual([
      { id: 'lane-1-strongest', focus: CandidateGenerationFocus.Strongest },
      { id: 'lane-2-diverse', focus: CandidateGenerationFocus.Diverse },
    ]);
  });

  it('cycles the focus order past the third lane', () => {
    expect(buildCandidateGenerationLanes(4).map((lane) => lane.focus)).toEqual([
      CandidateGenerationFocus.Strongest,
      CandidateGenerationFocus.Diverse,
      CandidateGenerationFocus.Wildcard,
      CandidateGenerationFocus.Strongest,
    ]);
  });

  it('always yields at least one lane for a non-positive count', () => {
    expect(buildCandidateGenerationLanes(0)).toHaveLength(1);
    expect(buildCandidateGenerationLanes(-2)).toHaveLength(1);
  });
});

describe('buildLaneFocusSection', () => {
  it('appends the heading, the focus directive, and the safety reminder', () => {
    const section = buildLaneFocusSection({
      id: 'lane-1-strongest',
      focus: CandidateGenerationFocus.Strongest,
    });

    expect(section).toContain(LANE_FOCUS_SECTION_HEADING);
    expect(section).toContain(LANE_FOCUS_DIRECTIVE[CandidateGenerationFocus.Strongest]);
    expect(section).toContain(LANE_FOCUS_SAFETY_REMINDER);
  });
});
