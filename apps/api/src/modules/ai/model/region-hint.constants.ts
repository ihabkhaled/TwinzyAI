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
  it: 'The user chose Italian. Treat Italian entertainment as FIRST-CLASS in the sweep: Italian cinema, TV, music, and fashion figures — alongside the global pools.',
  fa: 'The user chose Persian. Treat Persian-speaking entertainment as FIRST-CLASS in the sweep: Iranian cinema, TV, and music, plus diaspora figures — alongside the global pools.',
  fr: 'The user chose French. Treat Francophone entertainment as FIRST-CLASS in the sweep: French cinema, TV, and music, plus Belgian, Swiss, Québécois, and Francophone African figures — alongside the global pools.',
  de: 'The user chose German. Treat German-speaking entertainment as FIRST-CLASS in the sweep: German, Austrian, and Swiss cinema, TV, and music — alongside the global pools.',
  es: 'The user chose Spanish. Treat Spanish-speaking entertainment as FIRST-CLASS in the sweep: Spanish and Latin American cinema, TV, and music across the whole region — alongside the global pools.',
  pt: 'The user chose Portuguese. Treat Portuguese-speaking entertainment as FIRST-CLASS in the sweep: Brazilian and Portuguese cinema, TV, music, and sport — alongside the global pools.',
  hi: 'The user chose Hindi. Treat Indian entertainment as FIRST-CLASS in the sweep: Bollywood plus regional Indian cinema, TV, music, and sport — alongside the global pools.',
  th: 'The user chose Thai. Treat Thai entertainment as FIRST-CLASS in the sweep: Thai cinema, TV dramas, and music — alongside the global pools.',
  zh: 'The user chose Chinese. Treat Chinese-speaking entertainment as FIRST-CLASS in the sweep: mainland Chinese, Hong Kong, and Taiwanese cinema, TV, and music — alongside the global pools.',
  ja: 'The user chose Japanese. Treat Japanese entertainment as FIRST-CLASS in the sweep: Japanese cinema, TV, music, and idol/variety figures — alongside the global pools.',
};
