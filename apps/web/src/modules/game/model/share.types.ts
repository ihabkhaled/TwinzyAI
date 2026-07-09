import type { CreateShareResultResponse, FinalGameResult } from '@twinzy/shared';

import type { GameResultView } from './game.types';
import type { SharePagePhaseValue } from './share.enums';

/** Internal create-share hook surface (raw keys; the container translates). */
export interface ShareCreateController {
  isOpen: boolean;
  isCreating: boolean;
  shareUrl: string | undefined;
  errorKey: string | undefined;
  copyFeedbackKey: string | undefined;
  canNativeShare: boolean;
  open: () => void;
  close: () => void;
  copyLink: () => void;
  nativeShare: () => void;
}

/** Countdown state derived from the authoritative server `expiresAt`. */
export interface CountdownState {
  remainingSeconds: number;
  isExpired: boolean;
}

/** Internal share-page hook surface: phase + data + live countdown. */
export interface SharePageController {
  phase: SharePagePhaseValue;
  result: FinalGameResult | undefined;
  remainingSeconds: number;
}

/** Metadata a successful create returns to the UI. */
export type ShareCreateResult = CreateShareResultResponse;

/** Narrowed surface of the create-share mutation the hook consumes. */
export interface CreateShareMutation {
  isPending: boolean;
  isError: boolean;
  create: (
    result: FinalGameResult,
    callbacks: { onSuccess: (data: ShareCreateResult) => void; onError: () => void },
  ) => void;
  reset: () => void;
}

/** The mapped share-page view model the public page renders. */
export interface SharePageViewModel {
  phase: SharePagePhaseValue;
  countdownLabel: string;
  resultView: GameResultView | undefined;
}
