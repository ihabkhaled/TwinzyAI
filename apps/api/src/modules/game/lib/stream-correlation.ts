import { randomUUID } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Returns the caller-supplied correlation id when it is a well-formed uuid,
 * otherwise mints a fresh one. Guarantees every stamped frame carries a valid
 * uuid even when a non-browser client omits or malforms the id header — so the
 * shared contract's uuid validation on the client never rejects our own frames.
 */
export const resolveCorrelationId = (value: string | undefined): string =>
  value !== undefined && UUID_PATTERN.test(value) ? value : randomUUID();

/** Mints the server-owned stream id for a newly admitted stream. */
export const randomStreamId = (): string => randomUUID();
