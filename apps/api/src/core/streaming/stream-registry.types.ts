/** A live streaming analysis tracked for cancellation and TTL reclamation. */
export interface StreamRegistration {
  readonly streamId: string;
  readonly tabId: string;
  readonly requestId: string;
  readonly controller: AbortController;
}

/**
 * Correlation ids that must ALL match a live registration for a cancel to take
 * effect — so one tab (or user) can never abort another's run.
 */
export interface StreamCancelKey {
  readonly streamId: string;
  readonly tabId: string;
  readonly requestId: string;
}
