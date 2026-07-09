import type { AppQueryKey } from '@/packages/query';

import { SharePlatform, type SharePlatformValue } from './share.enums';

/** Cache address for the create-share mutation. */
export const SHARE_CREATE_MUTATION_KEY: AppQueryKey = ['share', 'create'];

/** Builds the query key for reading one share by its UUID. */
export const buildShareResultQueryKey = (shareId: string): AppQueryKey => ['share', shareId];

/** Countdown refresh cadence — one tick per second. */
export const COUNTDOWN_TICK_MS = 1000;

/** Seconds in a minute — for mm:ss formatting. */
export const SECONDS_PER_MINUTE = 60;

/** Digit width each mm:ss field is zero-padded to. */
export const COUNTDOWN_PAD_WIDTH = 2;

/** DOM id linking the share dialog to its title (aria-labelledby). */
export const SHARE_MODAL_TITLE_ID = 'share-modal-title';

/** Per-request timeout for the create-share call (well under AI latency). */
export const SHARE_CREATE_TIMEOUT_MS = 15_000;

/** Order the fallback platform buttons render in. */
export const SHARE_PLATFORM_ORDER: readonly SharePlatformValue[] = [
  SharePlatform.WhatsApp,
  SharePlatform.Telegram,
  SharePlatform.X,
  SharePlatform.Facebook,
  SharePlatform.LinkedIn,
  SharePlatform.Reddit,
  SharePlatform.Email,
];

/** i18n label key for each platform button (accessible name). */
export const SHARE_PLATFORM_LABEL_KEYS: Record<SharePlatformValue, string> = {
  [SharePlatform.WhatsApp]: 'share.platform.whatsapp',
  [SharePlatform.Telegram]: 'share.platform.telegram',
  [SharePlatform.Facebook]: 'share.platform.facebook',
  [SharePlatform.X]: 'share.platform.x',
  [SharePlatform.LinkedIn]: 'share.platform.linkedin',
  [SharePlatform.Reddit]: 'share.platform.reddit',
  [SharePlatform.Email]: 'share.platform.email',
};

/** i18n keys reused across the share modal + public page. */
export const SHARE_MESSAGE_KEYS = {
  shareText: 'share.shareText',
  copySuccess: 'share.copySuccess',
  copyFailed: 'share.copyFailed',
  createFailed: 'share.createFailed',
} as const;
