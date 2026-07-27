/**
 * Shared field-bound constants for API response schemas and prompt contracts.
 * Keeping them in one place guarantees the backend, frontend, and prompts agree
 * on the same hard limits.
 */

/** Longest accepted public-figure name or country/region string. */
export const MAX_NAME_LENGTH = 120;

/** Longest accepted reason / final reason text. */
export const MAX_REASON_LENGTH = 1000;

/** Longest accepted judge notes / score explanation text. */
export const MAX_JUDGE_NOTES_LENGTH = 600;

/** Longest accepted why-this-candidate-was-chosen text. */
export const MAX_CHOSEN_REASON_LENGTH = 600;

/** Longest accepted fallback message, disclaimer, or removal reason. */
export const MAX_FALLBACK_MESSAGE_LENGTH = 500;

/** Longest accepted disclaimer text. */
export const MAX_DISCLAIMER_LENGTH = 500;

/** Longest accepted removal reason text. */
export const MAX_REMOVED_REASON_LENGTH = 500;

/** Longest accepted localized trait-reference snippet in detail arrays. */
export const MAX_TRAIT_REFERENCE_LENGTH = 200;

/** Maximum items in a candidate's aligned/mismatch trait arrays. */
export const MAX_TRAIT_ARRAY_ITEMS = 15;

/** Longest accepted high-signal trait token. */
export const MAX_TRAIT_TOKEN_LENGTH = 80;

/** Maximum weight value for weighted-trait evidence. */
export const MAX_TRAIT_EVIDENCE_WEIGHT = 10;

/** Longest accepted image-quality-cap impact text. */
export const MAX_IMAGE_QUALITY_IMPACT_LENGTH = 200;

/** Longest accepted visual-archetype hint or candidate-search archetype. */
export const MAX_ARCHETYPE_LENGTH = 200;

/** Longest accepted candidate-search-hint reason. */
export const MAX_SEARCH_HINT_REASON_LENGTH = 300;

/** Maximum high-signal tokens in a trait extraction response. */
export const MAX_HIGH_SIGNAL_TOKENS = 30;

/** Maximum weighted-evidence entries in a trait extraction response. */
export const MAX_WEIGHTED_EVIDENCE_ITEMS = 30;

/** Maximum visual-archetype hints in a trait extraction response. */
export const MAX_VISUAL_ARCHETYPE_HINTS = 10;

/** Maximum image-quality caps in a trait extraction response. */
export const MAX_IMAGE_QUALITY_CAPS = 5;

/** Maximum candidate-search hints in a trait extraction response. */
export const MAX_CANDIDATE_SEARCH_HINTS = 10;

/** Maximum bounded qualitative signals in one matching-profile lane. */
export const MAX_MATCHING_SIGNALS = 20;

/** Maximum mutable styling signals accepted from extraction. */
export const MAX_MUTABLE_MATCHING_SIGNALS = 12;

/** Maximum expression/presentation signals accepted from extraction. */
export const MAX_PRESENTATION_MATCHING_SIGNALS = 8;

/** Maximum machine-readable matching signal/entity/source identifier length. */
export const MAX_MATCHING_ID_LENGTH = 120;

/** Maximum source references or signature looks on one catalog profile. */
export const MAX_PUBLIC_FIGURE_SOURCE_ITEMS = 12;

/** Maximum aliases, tags, categories, and occupations on public-figure data. */
export const MAX_PUBLIC_FIGURE_METADATA_ITEMS = 30;

/** Maximum localized-name entries accepted on a catalog profile. */
export const MAX_LOCALIZED_NAME_ITEMS = 20;

/** Maximum verified biography text returned to the client. */
export const MAX_BIOGRAPHY_SUMMARY_LENGTH = 1200;

/** Maximum participant evidence items in ranking, judge, and critique reports. */
export const MAX_PARTICIPANT_EVIDENCE_ITEMS = 30;

/** Maximum candidate critiques in one participant critique response. */
export const MAX_CANDIDATE_CRITIQUES = 25;

/** Inclusive normalized score bounds used by advanced matching reports. */
export const MIN_MATCHING_SCORE = 0;
export const MAX_MATCHING_SCORE = 100;

/** Inclusive locale-key length accepted in localized-name maps. */
export const MIN_LOCALE_KEY_LENGTH = 2;
export const MAX_LOCALE_KEY_LENGTH = 12;

/** Inclusive backend-approved critique adjustment bounds. */
export const MIN_CRITIQUE_SCORE_ADJUSTMENT = -100;
export const MAX_CRITIQUE_SCORE_ADJUSTMENT = 100;

/** JSON.stringify indentation used for prompt payloads. */
export const PROMPT_JSON_INDENT = 2;

/** Minimum valid HTTP status code. */
export const MIN_HTTP_STATUS_CODE = 100;

/** Maximum valid HTTP status code. */
export const MAX_HTTP_STATUS_CODE = 599;

/** Maximum length of a machine-readable error code. */
export const MAX_ERROR_CODE_LENGTH = 80;

/** Maximum length of an i18n error message key (`errors.<feature>.<key>`). */
export const MAX_ERROR_MESSAGE_KEY_LENGTH = 120;

/** Maximum length of a user-facing error message. */
export const MAX_ERROR_MESSAGE_LENGTH = 500;

/** HTTP status code for too-many-requests. */
export const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

/** HTTP status code for internal server error. */
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

/** HTTP status code for service unavailable. */
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;

/** HTTP status code for not found. */
export const HTTP_STATUS_NOT_FOUND = 404;
