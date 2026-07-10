import { FORBIDDEN_RESULT_PHRASES, FORBIDDEN_SENSITIVE_TOPICS } from '@twinzy/shared';

/**
 * Every phrase that makes a result unshareable. The shared lists are the single
 * source of truth (same lists the AI safety filter uses); this merges them for
 * the share-input scanner so a crafted create request cannot smuggle forbidden
 * wording into a public page.
 */
export const ALL_FORBIDDEN_SHARE_PHRASES: readonly string[] = [
  ...FORBIDDEN_RESULT_PHRASES,
  ...FORBIDDEN_SENSITIVE_TOPICS,
];

/**
 * Markers of embedded image bytes. No shared field may carry a `data:` image
 * URL or a base64 blob — the game never stores or shares images, so any such
 * payload is rejected before it can reach the cache or a public page.
 */
export const EMBEDDED_IMAGE_PATTERNS: readonly RegExp[] = [
  /data:image\//i,
  /data:application\/octet-stream/i,
  /;base64,/i,
  /(?:^|[^A-Za-z0-9+/])\/9j\/[A-Za-z0-9+/=]{16,}/u,
  /(?:^|[^A-Za-z0-9+/])iVBORw0KGgo[A-Za-z0-9+/=]{16,}/u,
  /(?:^|[^A-Za-z0-9+/])UklGR[A-Za-z0-9+/=]{16,}/u,
  /^[A-Za-z0-9+/]{256,}={0,2}$/u,
];
