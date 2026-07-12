import type {
  ConfidenceLevelValue,
  GameStreamStageValue,
  PublicCategoryValue,
  TraitCategoryKey,
  UncertaintyNoteField,
  VerdictValue,
} from '@twinzy/shared';
import {
  ConfidenceLevel,
  ErrorCode,
  GameStreamStage,
  PublicCategory,
  TRAIT_CATEGORY_KEYS,
  Verdict,
} from '@twinzy/shared';

/** Re-exported so the module owns one stable import surface for these values. */
export {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  DEFAULT_RESULT_COUNT,
  GAME_ANALYZE_PATH,
  GAME_ANALYZE_STREAM_PATH,
  GAME_TRANSLATE_RESULT_PATH,
  RESULT_COUNT_OPTIONS,
} from '@twinzy/shared';

/** Multipart fields shared with the backend parser. */
export {
  UPLOAD_CONSENT_FIELD_NAME as CONSENT_FIELD_NAME,
  UPLOAD_CONSENT_GRANTED_VALUE as CONSENT_FIELD_VALUE,
  UPLOAD_FIELD_NAME,
} from '@twinzy/shared';

/** Multipart form-field carrying the active UI language for localized AI output. */
export const LANGUAGE_FIELD_NAME = 'languageCode';

/** Multipart form-field carrying the user-selected number of results (1–10). */
export const RESULT_COUNT_FIELD_NAME = 'resultCount';

/** DOM ids that wire the labels/inputs together for the setup form. */
export const PHOTO_INPUT_ID = 'game-photo-input';

export const CONSENT_INPUT_ID = 'game-consent';

export const RESULT_COUNT_INPUT_ID = 'game-result-count';

/** File-picker `accept` allow-list; mirrors the server's accepted MIME types. */
export const UPLOAD_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp';

/** i18n message key the live-camera capture hook stores when the stream fails. */
export const CAMERA_ERROR_MESSAGE_KEY = 'game.cameraError';

/** `kind` for the silent captions track that satisfies <video> a11y (no audio). */
export const CAPTIONS_TRACK_KIND = 'captions';

/** i18n key shown as feedback after share text is copied to the clipboard. */
export const SHARE_COPIED_MESSAGE_KEY = 'result.shareCopied';

/**
 * i18n message key for each streamed pipeline stage, shown as live progress
 * while the analyze request runs. Keys resolve against the `game.stage.*`
 * namespace in packages/i18n/messages.
 */
export const STAGE_LABEL_KEYS: Record<GameStreamStageValue, string> = {
  [GameStreamStage.Validating]: 'game.stage.validating',
  [GameStreamStage.Scanning]: 'game.stage.scanning',
  [GameStreamStage.ExtractingTraits]: 'game.stage.extractingTraits',
  [GameStreamStage.GeneratingCandidates]: 'game.stage.generatingCandidates',
  [GameStreamStage.Judging]: 'game.stage.judging',
  [GameStreamStage.Aggregating]: 'game.stage.aggregating',
};

/**
 * Friendly game-specific i18n message keys for backend error codes. These live
 * in the `errors.*` namespace in packages/i18n/messages and preserve the
 * per-code copy (consent, rate-limit, AI-unavailable) the generic HTTP-status
 * mapper cannot express.
 */
const GAME_ERROR_MESSAGE_KEYS = {
  fileMissing: 'errors.fileMissing',
  fileTooLarge: 'errors.fileTooLarge',
  fileTypeNotAllowed: 'errors.fileTypeNotAllowed',
  multipleFiles: 'errors.multipleFiles',
  consentRequired: 'errors.consentRequired',
  rateLimited: 'errors.rateLimited',
  serverBusy: 'errors.serverBusy',
  aiUnavailable: 'errors.aiUnavailable',
  network: 'errors.network',
  payment: 'errors.payment',
  paymentRequired: 'errors.paymentRequired',
} as const;

export type GameErrorMessageKey =
  (typeof GAME_ERROR_MESSAGE_KEYS)[keyof typeof GAME_ERROR_MESSAGE_KEYS];

/**
 * Error codes where retrying the SAME photo can genuinely succeed (quota,
 * timeout, overload, provider blip). The error UI offers a non-destructive
 * "try again" for these instead of forcing a re-pick.
 */
/**
 * Client-only error code for transport failures that never carried a backend
 * code (connection drop mid-stream). Not an {@link ErrorCode} member because
 * the backend never emits it.
 */
const CLIENT_NETWORK_ERROR_CODE = 'NETWORK_ERROR';

export const TRANSIENT_ERROR_CODES = [
  ErrorCode.RateLimited,
  ErrorCode.AiRateLimited,
  ErrorCode.ServerBusy,
  ErrorCode.AiTimeout,
  ErrorCode.AiProviderUnavailable,
  CLIENT_NETWORK_ERROR_CODE,
] as const;

/** Backend error codes mapped to friendly game i18n message keys. */
export const GAME_ERROR_KEY_BY_CODE: Record<string, GameErrorMessageKey> = {
  [ErrorCode.ConsentRequired]: GAME_ERROR_MESSAGE_KEYS.consentRequired,
  [ErrorCode.FileMissing]: GAME_ERROR_MESSAGE_KEYS.fileMissing,
  [ErrorCode.FileTooLarge]: GAME_ERROR_MESSAGE_KEYS.fileTooLarge,
  [ErrorCode.FileTypeNotAllowed]: GAME_ERROR_MESSAGE_KEYS.fileTypeNotAllowed,
  [ErrorCode.FileInvalid]: GAME_ERROR_MESSAGE_KEYS.fileTypeNotAllowed,
  [ErrorCode.MultipleFilesNotAllowed]: GAME_ERROR_MESSAGE_KEYS.multipleFiles,
  [ErrorCode.RateLimited]: GAME_ERROR_MESSAGE_KEYS.rateLimited,
  [ErrorCode.AiRateLimited]: GAME_ERROR_MESSAGE_KEYS.rateLimited,
  [ErrorCode.ServerBusy]: GAME_ERROR_MESSAGE_KEYS.serverBusy,
  [ErrorCode.AiProviderUnavailable]: GAME_ERROR_MESSAGE_KEYS.aiUnavailable,
  [ErrorCode.AiTimeout]: GAME_ERROR_MESSAGE_KEYS.aiUnavailable,
  [ErrorCode.AiResponseInvalid]: GAME_ERROR_MESSAGE_KEYS.aiUnavailable,
  [ErrorCode.AiResponseUnsafe]: GAME_ERROR_MESSAGE_KEYS.aiUnavailable,
  [CLIENT_NETWORK_ERROR_CODE]: GAME_ERROR_MESSAGE_KEYS.network,
  [ErrorCode.PaymentRequired]: GAME_ERROR_MESSAGE_KEYS.paymentRequired,
  [ErrorCode.PaymentOrderInvalid]: GAME_ERROR_MESSAGE_KEYS.payment,
  [ErrorCode.PaymentProviderUnavailable]: GAME_ERROR_MESSAGE_KEYS.payment,
};

/**
 * Payment failures are not pipeline-stage failures — the capture happens
 * between the scanning and extraction stages, so the terminal frame's `stage`
 * (the last one emitted) must NOT be prefixed onto a payment error's copy.
 */
export const PAYMENT_ERROR_CODES: readonly string[] = [
  ErrorCode.PaymentRequired,
  ErrorCode.PaymentOrderInvalid,
  ErrorCode.PaymentProviderUnavailable,
];

/** i18n key shown when translation fails and the old language is kept. */
export const TRANSLATION_FAILED_MESSAGE_KEY = 'errors.translationFailed';

/**
 * Per-request timeout (ms) for the translate-result call. Real Gemini
 * translation of a full result runs 13–25s, well past the shared client's 15s
 * default, so this request needs a generous ceiling or slow (but valid)
 * translations abort mid-flight and surface as a failure. Kept finite so a
 * genuinely hung request still terminates and the user can retry.
 */
export const AI_TRANSLATE_REQUEST_TIMEOUT_MS = 60_000;

/** Square render size (px) for the in-memory photo preview. */
export const PREVIEW_IMAGE_SIZE = 160;

/** Default size for synthetic image files used in unit tests. */
export const DEFAULT_TEST_IMAGE_SIZE_BYTES = 1024;

/** i18n title key per trait category, shown as accordion group headings. */
export const TRAIT_CATEGORY_LABEL_KEYS: Record<TraitCategoryKey, string> = Object.fromEntries(
  TRAIT_CATEGORY_KEYS.map((key) => [key, `result.traitCategories.${key}`]),
) as Record<TraitCategoryKey, string>;

/** i18n label key for one trait field inside a category. */
export const buildTraitFieldLabelKey = (category: TraitCategoryKey, field: string): string =>
  `result.traitFields.${category}.${field}`;

/** i18n label key per uncertainty-notes list. */
export const UNCERTAINTY_LABEL_KEYS: Record<UncertaintyNoteField, string> = {
  imageLimitations: 'result.uncertainty.imageLimitations',
  unclearCategories: 'result.uncertainty.unclearCategories',
  lowConfidenceObservations: 'result.uncertainty.lowConfidenceObservations',
  traitsNotVisible: 'result.uncertainty.traitsNotVisible',
};

/** i18n message key for each verdict band. */
export const VERDICT_LABEL_KEYS: Record<VerdictValue, string> = {
  [Verdict.Strong]: 'result.verdict.strong',
  [Verdict.Medium]: 'result.verdict.medium',
  [Verdict.Weak]: 'result.verdict.weak',
};

/** i18n message key for each confidence band. */
export const CONFIDENCE_LABEL_KEYS: Record<ConfidenceLevelValue, string> = {
  [ConfidenceLevel.High]: 'result.confidence.high',
  [ConfidenceLevel.Medium]: 'result.confidence.medium',
  [ConfidenceLevel.Low]: 'result.confidence.low',
};

/** i18n message key for each public-figure category. */
export const PUBLIC_CATEGORY_LABEL_KEYS: Record<PublicCategoryValue, string> = {
  [PublicCategory.Actor]: 'result.category.actor',
  [PublicCategory.Singer]: 'result.category.singer',
  [PublicCategory.Creator]: 'result.category.creator',
  [PublicCategory.Athlete]: 'result.category.athlete',
  [PublicCategory.PublicFigure]: 'result.category.public_figure',
  [PublicCategory.Other]: 'result.category.other',
};
