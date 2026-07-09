import { randomUUID } from 'node:crypto';

/**
 * Mints an unguessable share id. A v4 UUID from the platform CSPRNG — never a
 * sequential or predictable id — so a share link cannot be guessed or
 * enumerated.
 */
export const generateShareId = (): string => randomUUID();
