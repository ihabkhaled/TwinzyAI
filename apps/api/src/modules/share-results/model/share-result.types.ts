import type { FinalGameResult, LanguageCodeValue } from '@twinzy/shared';

/**
 * A temporary share record as it lives in the cache. Holds ONLY the safe final
 * result JSON plus timing metadata — never an image, an image reference, or any
 * private data. Timestamps are epoch milliseconds so expiry math needs no date
 * parsing on the hot path.
 */
export interface StoredShareRecord {
  readonly shareId: string;
  readonly languageCode: LanguageCodeValue;
  readonly result: FinalGameResult;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
}

/** The created/expiry timestamps for a share record (epoch milliseconds). */
export interface ShareExpiryWindow {
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
}
