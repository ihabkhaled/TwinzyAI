import {
  ALL_FORBIDDEN_SHARE_PHRASES,
  EMBEDDED_IMAGE_PATTERNS,
} from '../model/share-safety.constants';

/**
 * Recursively collects every string leaf of an arbitrary value. Used to scan
 * an entire incoming result — traits, summaries, reasons, every nested field —
 * so no forbidden wording or embedded image bytes can hide anywhere in it.
 */
export const collectStringValues = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectStringValues(entry));
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap((entry) => collectStringValues(entry));
  }
  return [];
};

/** Case-insensitive scan for wording a shared result must never contain. */
export const containsForbiddenShareWording = (text: string): boolean => {
  const lowered = text.toLowerCase();
  return ALL_FORBIDDEN_SHARE_PHRASES.some((phrase) => lowered.includes(phrase));
};

/** Detects a `data:` image URL or a base64 blob smuggled into a text field. */
export const containsEmbeddedImageData = (text: string): boolean =>
  EMBEDDED_IMAGE_PATTERNS.some((pattern) => pattern.test(text));

/** A field is unshareable if it carries forbidden wording OR embedded image bytes. */
export const isUnshareableText = (text: string): boolean =>
  containsForbiddenShareWording(text) || containsEmbeddedImageData(text);
