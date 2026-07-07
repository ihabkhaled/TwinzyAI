/** Identity of an analysis run competing for a concurrency slot. */
export interface AnalysisSlotRequest {
  readonly ip: string;
  readonly tabId: string;
}

/** A granted concurrency slot; releasing it frees capacity and drains the queue. */
export interface AnalysisSlot {
  readonly release: () => void;
}

/**
 * Outcome of an acquire attempt: a usable slot, or a rejection when the system
 * is over capacity and the wait queue is full (surfaced to the client as
 * SERVER_BUSY).
 */
export type AcquireOutcome =
  { readonly granted: true; readonly slot: AnalysisSlot } | { readonly granted: false };
