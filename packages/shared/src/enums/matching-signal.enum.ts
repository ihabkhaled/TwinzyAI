export const MatchingSignalConfidence = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
} as const;

export const MATCHING_SIGNAL_CONFIDENCE_VALUES = Object.values(MatchingSignalConfidence);

export type MatchingSignalConfidenceValue =
  (typeof MatchingSignalConfidence)[keyof typeof MatchingSignalConfidence];

export const MatchingSignalVisibility = {
  Visible: 'visible',
  Partial: 'partial',
  Occluded: 'occluded',
  Uncertain: 'uncertain',
} as const;

export const MATCHING_SIGNAL_VISIBILITY_VALUES = Object.values(MatchingSignalVisibility);

export type MatchingSignalVisibilityValue =
  (typeof MatchingSignalVisibility)[keyof typeof MatchingSignalVisibility];

export const MatchingSignalModifier = {
  Eyewear: 'eyewear',
  FacialHair: 'facialHair',
  Hairstyle: 'hairstyle',
  Clothing: 'clothing',
  Accessories: 'accessories',
  Angle: 'angle',
  Lighting: 'lighting',
} as const;

export const MATCHING_SIGNAL_MODIFIER_VALUES = Object.values(MatchingSignalModifier);

export type MatchingSignalModifierValue =
  (typeof MatchingSignalModifier)[keyof typeof MatchingSignalModifier];
