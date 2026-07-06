import type { FinalGameResult } from '@twinzy/shared';
import { RESULT_DISCLAIMER, TRAIT_KEYS } from '@twinzy/shared';

import type { TranslateMessage } from '../model/game.types';

/** A representative backend analyze response, overridable per test. */
export const buildFinalResult = (overrides: Partial<FinalGameResult> = {}): FinalGameResult => ({
  traits: Object.fromEntries(
    TRAIT_KEYS.map((key) => [key, `observed ${key}`]),
  ) as FinalGameResult['traits'],
  results: [
    {
      name: 'Sample Star',
      rank: 1,
      finalStyleVibeFitScore: 87,
      verdict: 'strong',
      reason: 'Shares a similar public style impression based on hair and jawline traits.',
      matchingTraits: ['hairColor', 'jawlineChinOverallStructure'],
      weakOrUncertainTraits: ['eyeColorEyeShape'],
    },
  ],
  fallbackMessage: '',
  disclaimer: RESULT_DISCLAIMER,
  ...overrides,
});

/** A synthetic in-memory image File for validation/gateway tests. */
export const buildImageFile = (name = 'photo.jpg', type = 'image/jpeg', sizeBytes = 2048): File => {
  const content = new Uint8Array(sizeBytes).fill(65);
  return new File([content], name, { type });
};

/**
 * A deterministic stand-in for the injected translator: it echoes the message
 * key (so label lookups are assertable) and applies `{placeholder}` values for
 * the one ICU message the share text needs.
 */
export const fakeTranslate: TranslateMessage = (key, values) => {
  const template =
    key === 'result.shareTemplate'
      ? 'I tried this fun vibe game and got: {name} with {score}% style/vibe fit.'
      : key;
  if (values === undefined) {
    return template;
  }
  let output = template;
  for (const [name, value] of Object.entries(values)) {
    output = output.replaceAll(`{${name}}`, String(value));
  }
  return output;
};
