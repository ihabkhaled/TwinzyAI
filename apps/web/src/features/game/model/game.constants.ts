import type { TraitKey } from '@twinzy/shared';

import type { TranslationKey } from '@/i18n';

export {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  GAME_ANALYZE_PATH,
} from '@twinzy/shared';

export const UPLOAD_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp';

/** i18n label key for each of the 15 trait fields, in display order. */
export const TRAIT_LABEL_KEYS: Record<TraitKey, TranslationKey> = {
  faceShape: 'trait.faceShape',
  skinToneUndertone: 'trait.skinToneUndertone',
  hairColor: 'trait.hairColor',
  hairTexture: 'trait.hairTexture',
  hairStyleLength: 'trait.hairStyleLength',
  hairline: 'trait.hairline',
  foreheadShapeSize: 'trait.foreheadShapeSize',
  eyebrowShapeThickness: 'trait.eyebrowShapeThickness',
  eyeColorEyeShape: 'trait.eyeColorEyeShape',
  noseShape: 'trait.noseShape',
  cheekbonesCheeks: 'trait.cheekbonesCheeks',
  lipsMouthShape: 'trait.lipsMouthShape',
  beardMustacheColor: 'trait.beardMustacheColor',
  beardMustacheStyleDensity: 'trait.beardMustacheStyleDensity',
  jawlineChinOverallStructure: 'trait.jawlineChinOverallStructure',
} as const;

/** Backend error codes mapped to friendly i18n messages. */
export const ERROR_MESSAGE_KEYS: Record<string, TranslationKey> = {
  CONSENT_REQUIRED: 'error.consentRequired',
  FILE_MISSING: 'error.fileMissing',
  FILE_TOO_LARGE: 'error.fileTooLarge',
  FILE_TYPE_NOT_ALLOWED: 'error.fileTypeNotAllowed',
  FILE_INVALID: 'error.fileTypeNotAllowed',
  MULTIPLE_FILES_NOT_ALLOWED: 'error.multipleFiles',
  RATE_LIMITED: 'error.rateLimited',
  AI_PROVIDER_UNAVAILABLE: 'error.aiUnavailable',
  AI_TIMEOUT: 'error.aiUnavailable',
  AI_RESPONSE_INVALID: 'error.aiUnavailable',
  AI_RESPONSE_UNSAFE: 'error.aiUnavailable',
  NETWORK_ERROR: 'error.network',
} as const;
