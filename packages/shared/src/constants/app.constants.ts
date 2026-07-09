import type { LanguageCodeValue } from './language.constants';

export const APP_NAME = 'Twinzy';

export const MODEL_PROVIDER = 'Google Gemini';

export const API_GLOBAL_PREFIX = 'api';

export const API_VERSION = 'v1';

export const GAME_ANALYZE_PATH = '/api/v1/game/analyze';

/**
 * Streaming variant of the analyze route. Responds with text/event-stream and
 * keeps the connection alive with heartbeats + progress events, so the long
 * multi-step Gemini pipeline never hits an idle/response timeout.
 */
export const GAME_ANALYZE_STREAM_PATH = '/api/v1/game/analyze/stream';

/**
 * Text-only translation route: takes an existing structured result plus a
 * target language and returns the same result localized — never the image,
 * never a re-analysis, names/scores/ranks preserved server-side.
 */
export const GAME_TRANSLATE_RESULT_PATH = '/api/v1/game/translate-result';

/**
 * Cancels an in-flight streaming analyze run. Takes the tab/request/stream
 * correlation ids and aborts only the exactly-matching stream, so cancelling
 * one tab never disturbs another tab's (or user's) run.
 */
export const GAME_CANCEL_PATH = '/api/v1/game/cancel';

export const HEALTH_PATH = '/api/v1/health';

/**
 * The active prompt-contract version. Every AI response must echo it; a
 * mismatch fails schema validation, so a stale model/template pairing can
 * never silently serve the old contract.
 */
export const GAME_PROMPT_VERSION = 'visual-similarity-v4';

/**
 * Server-enforced localized safety disclaimer. The model's own disclaimer
 * text is never trusted or forwarded — aggregation and translation always
 * overwrite it with this fixed copy for the response's languageCode.
 */
export const RESULT_DISCLAIMER_BY_LANGUAGE: Record<LanguageCodeValue, string> = {
  en: 'This is a playful visual-resemblance result on your own photo, for entertainment. Your photo is never stored and is never used to identify you.',
  ar: 'هذه نتيجة شبه بصري ممتعة على صورتك أنت، للتسلية فقط. لا تُحفظ صورتك أبدًا ولا تُستخدم للتعرف على هويتك.',
};

/** English disclaimer kept as the canonical reference copy. */
export const RESULT_DISCLAIMER = RESULT_DISCLAIMER_BY_LANGUAGE.en;

/** Server-enforced localized no-match fallback message. */
export const NO_MATCH_FALLBACK_BY_LANGUAGE: Record<LanguageCodeValue, string> = {
  en: 'We could not find a confident style/vibe match this time. Try another photo with clearer lighting.',
  ar: 'لم نعثر على تطابق واثق في الأسلوب والانطباع هذه المرة. جرّب صورة أخرى بإضاءة أوضح.',
};

/** English fallback kept as the canonical reference copy. */
export const NO_MATCH_FALLBACK_MESSAGE = NO_MATCH_FALLBACK_BY_LANGUAGE.en;
