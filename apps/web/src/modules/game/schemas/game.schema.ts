/**
 * The gateway validates the analyze response and the result-count input against
 * the backend's own shared zod contracts. Re-exported here so the HTTP layer
 * imports the module's schema surface rather than reaching into `@twinzy/shared`
 * directly.
 */
export { FinalGameResultSchema, ResultCountSchema } from '@twinzy/shared';
