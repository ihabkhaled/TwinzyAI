/**
 * Per-request transport metadata the streaming endpoint needs beyond the
 * upload: the CORS origin, the client IP (concurrency key), and the per-tab /
 * per-request correlation ids read from headers. Extracted by @StreamMeta so
 * the controller handler stays a thin single delegation.
 */
export interface StreamRequestMeta {
  readonly origin: string | undefined;
  readonly ip: string;
  readonly tabId: string | undefined;
  readonly requestId: string | undefined;
}

/** The subset of the platform request @StreamMeta reads. */
export interface StreamMetaRequestLike {
  readonly headers: Record<string, string | string[] | undefined>;
  readonly ip?: string;
}
