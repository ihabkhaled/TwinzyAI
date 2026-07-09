/** The four states the public share page can be in. */
export const SharePagePhase = {
  Loading: 'loading',
  Active: 'active',
  Expired: 'expired',
  NotFound: 'not-found',
} as const;

export type SharePagePhaseValue = (typeof SharePagePhase)[keyof typeof SharePagePhase];

/**
 * Fallback share platforms offered when the native Web Share sheet is
 * unavailable. Each maps to a public web-intent link (no app SDK, no tracking);
 * the share carries only the temporary UUID URL + localized text — never the
 * photo.
 */
export const SharePlatform = {
  WhatsApp: 'whatsapp',
  Telegram: 'telegram',
  Facebook: 'facebook',
  X: 'x',
  LinkedIn: 'linkedin',
  Reddit: 'reddit',
  Email: 'email',
} as const;

export type SharePlatformValue = (typeof SharePlatform)[keyof typeof SharePlatform];
