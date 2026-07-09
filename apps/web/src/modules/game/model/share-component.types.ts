import type { GameResultView, ResultLabels } from './game.types';
import type { SharePlatformLink } from './share-modal.types';

/** Props for the public share page (the UUID comes from the route). */
export interface SharePageProps {
  shareId: string;
}

/** Props for the accessible countdown line ("This page disappears in mm:ss"). */
export interface CountdownTimerProps {
  label: string;
  testId?: string;
}

/**
 * Translated copy + "create your own" CTA for a terminal share state (expired
 * or not-found — same shape; the caller supplies copy + testId).
 */
export interface ShareStateMessageProps {
  title: string;
  description: string;
  createLabel: string;
  testId?: string;
}

/** Props for the fallback platform-share buttons row. */
export interface SharePlatformLinksProps {
  title: string;
  links: SharePlatformLink[];
}

/** Props for the public share page's active result body. */
export interface ShareResultBodyProps {
  view: GameResultView;
  labels: ResultLabels;
  traitCountLabel: string;
  countdownLabel: string;
  createLabel: string;
}
