/**
 * The exact 15 visible, non-identifying trait keys returned by trait extraction.
 * Order matters for display; the set is the schema contract with Gemini.
 */
export const TRAIT_KEYS = [
  'faceShape',
  'skinToneUndertone',
  'hairColor',
  'hairTexture',
  'hairStyleLength',
  'hairline',
  'foreheadShapeSize',
  'eyebrowShapeThickness',
  'eyeColorEyeShape',
  'noseShape',
  'cheekbonesCheeks',
  'lipsMouthShape',
  'beardMustacheColor',
  'beardMustacheStyleDensity',
  'jawlineChinOverallStructure',
] as const;

export const TRAIT_COUNT = TRAIT_KEYS.length;

export const MIN_CANDIDATES = 1;

export const MAX_CANDIDATES = 5;

export const MAX_FINAL_RESULTS = 4;

export const MIN_SCORE = 0;

export const MAX_SCORE = 100;

export const MIN_DISPLAY_SCORE = 70;
