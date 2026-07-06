/**
 * The gateway validates the analyze response against the backend's own shared
 * zod contract. Re-exported here so the HTTP layer imports the module's
 * schema surface rather than reaching into `@twinzy/shared` directly.
 */
export type { FinalGameResult } from '@twinzy/shared';
export { FinalGameResultSchema } from '@twinzy/shared';
