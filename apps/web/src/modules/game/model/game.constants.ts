import type { TraitKey, VerdictValue } from '@twinzy/shared';
import { Verdict } from '@twinzy/shared';

/** Re-exported so the module owns one stable import surface for these values. */
export {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  DEFAULT_MAX_IMAGE_SIZE_BYTES,
  GAME_ANALYZE_PATH,
  TRAIT_KEYS,
} from '@twinzy/shared';

/** Multipart form-field names the backend `/game/analyze` endpoint expects. */
export const UPLOAD_FIELD_NAME = 'image';

export const CONSENT_FIELD_NAME = 'consent';

export const CONSENT_FIELD_VALUE = 'true';

/** DOM ids that wire the labels/inputs together for the setup form. */
export const PHOTO_INPUT_ID = 'game-photo-input';

export const CAMERA_INPUT_ID = 'game-camera-input';

export const CONSENT_INPUT_ID = 'game-consent';

/** File-picker `accept` allow-list; mirrors the server's accepted MIME types. */
export const UPLOAD_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp';

/** Camera input accepts any image so mobile OSes open the camera app directly. */
export const CAMERA_INPUT_ACCEPT = 'image/*';

/** Rear-camera capture hint for the camera input on mobile. */
export const CAMERA_CAPTURE_MODE = 'environment';

/** i18n key shown as feedback after share text is copied to the clipboard. */
export const SHARE_COPIED_MESSAGE_KEY = 'result.shareCopied';

/** Square render size (px) for the in-memory photo preview. */
export const PREVIEW_IMAGE_SIZE = 160;

/** i18n message key for each of the 15 trait fields, in display order. */
export const TRAIT_LABEL_KEYS: Record<TraitKey, string> = {
  faceShape: 'result.traits.faceShape',
  skinToneUndertone: 'result.traits.skinToneUndertone',
  hairColor: 'result.traits.hairColor',
  hairTexture: 'result.traits.hairTexture',
  hairStyleLength: 'result.traits.hairStyleLength',
  hairline: 'result.traits.hairline',
  foreheadShapeSize: 'result.traits.foreheadShapeSize',
  eyebrowShapeThickness: 'result.traits.eyebrowShapeThickness',
  eyeColorEyeShape: 'result.traits.eyeColorEyeShape',
  noseShape: 'result.traits.noseShape',
  cheekbonesCheeks: 'result.traits.cheekbonesCheeks',
  lipsMouthShape: 'result.traits.lipsMouthShape',
  beardMustacheColor: 'result.traits.beardMustacheColor',
  beardMustacheStyleDensity: 'result.traits.beardMustacheStyleDensity',
  jawlineChinOverallStructure: 'result.traits.jawlineChinOverallStructure',
};

/** i18n message key for each verdict band. */
export const VERDICT_LABEL_KEYS: Record<VerdictValue, string> = {
  [Verdict.Strong]: 'result.verdict.strong',
  [Verdict.Medium]: 'result.verdict.medium',
  [Verdict.Weak]: 'result.verdict.weak',
};
