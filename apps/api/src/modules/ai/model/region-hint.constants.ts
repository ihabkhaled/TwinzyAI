import type { LanguageCodeValue } from '@twinzy/shared';

/**
 * The "likely audience region" search-coverage hint injected into the
 * candidate-generation prompt, derived from the user's chosen UI language (a
 * stronger signal than Accept-Language — the user picked it). It steers which
 * regional industries the recall sweep treats as first-class; it must NEVER
 * constrain who may appear (the prompt states this explicitly).
 */
export const REGION_HINT_BY_LANGUAGE: Readonly<Record<LanguageCodeValue, string>> = {
  en: 'The user chose English. Assume a GLOBAL audience: sweep worldwide industries evenly, with Hollywood/UK plus every major regional industry.',
  ar: 'The user chose Arabic. Treat Arabic-speaking industries as FIRST-CLASS in the sweep: Egyptian cinema, TV, and comedy, plus Gulf and Levant entertainment — alongside the global pools.',
};
