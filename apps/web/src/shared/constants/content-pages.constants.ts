/**
 * Section-key manifests for the editorial content pages. Each key maps to the
 * i18n triple `<key>Title` / `<key>Body1` / `<key>Body2` inside the page's
 * namespace, so a page renders as `keys.map(...)` and adding a section is one
 * key here plus its copy in both message files.
 */
export const HOME_SECTION_KEYS = [
  'whatIs',
  'how',
  'privacyValue',
  'limits',
  'safety',
  'results',
] as const;

export const ABOUT_SECTION_KEYS = [
  'story',
  'different',
  'never',
  'money',
  'technology',
  'contact',
] as const;

export const HOW_IT_WORKS_SECTION_KEYS = [
  'consent',
  'extraction',
  'wipe',
  'matching',
  'scoring',
  'seeNever',
] as const;

export const AI_SAFETY_SECTION_KEYS = [
  'noIdentity',
  'noSensitive',
  'consentFirst',
  'validation',
  'limitations',
  'feedback',
] as const;

export const PRIVACY_SECTION_KEYS = [
  'lifecycle',
  'notCollected',
  'thirdParties',
  'advertising',
  'choices',
] as const;

/** FAQ entries map to `q<n>` / `a<n>` keys in the `faq` namespace. */
export const FAQ_QUESTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
