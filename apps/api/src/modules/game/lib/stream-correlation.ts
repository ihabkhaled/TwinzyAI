import { randomUUID } from 'node:crypto';

import { CorrelationIdSchema } from '@twinzy/shared';

/**
 * Returns the caller-supplied correlation id when it is a valid uuid by the
 * SHARED contract's definition, otherwise mints a fresh one. Validating with the
 * exact same schema the client uses to parse frames guarantees every stamped
 * frame carries an id the client will accept — a hex-shaped but non-RFC id (from
 * a non-browser client) is re-minted rather than passed through, so the client
 * never rejects and drops our own frames.
 */
export const resolveCorrelationId = (value: string | undefined): string =>
  value !== undefined && CorrelationIdSchema.safeParse(value).success ? value : randomUUID();

/** Mints the server-owned stream id for a newly admitted stream. */
export const randomStreamId = (): string => randomUUID();
