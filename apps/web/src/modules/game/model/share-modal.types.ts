import type { SharePlatformValue } from './share.enums';

/**
 * Share-modal + platform-link types. Kept free of any game-view import so the
 * game view model can reference the modal view model without creating a
 * game.types ↔ share-component.types cycle.
 */

/** The URL + localized text a share carries (never an image). */
export interface ShareLinkContent {
  url: string;
  text: string;
}

/** One built, encoded platform share link ready to render as an anchor. */
export interface SharePlatformLink {
  platform: SharePlatformValue;
  labelKey: string;
  href: string;
}

/** Translated copy for the share modal. */
export interface ShareModalLabels {
  title: string;
  description: string;
  creating: string;
  copyLink: string;
  nativeShare: string;
  platformsTitle: string;
  close: string;
  createFailed: string;
  copyFeedback: string | undefined;
}

/** Props for the share modal (create link + copy + native + platforms). */
export interface ShareModalProps {
  labels: ShareModalLabels;
  isCreating: boolean;
  shareUrl: string | undefined;
  errorMessage: string | undefined;
  canNativeShare: boolean;
  platformLinks: SharePlatformLink[];
  onCopyLink: () => void;
  onNativeShare: () => void;
  onClose: () => void;
}

/** The assembled share-modal view model: the modal props plus its open flag. */
export interface ShareModalViewModel extends ShareModalProps {
  isOpen: boolean;
}
