/**
 * The API error-code catalog is a cross-side contract owned by
 * `@twinzy/shared` (the web client maps the same codes to friendly copy).
 * Re-exported here so backend code keeps one stable core-errors import surface.
 */
export { ErrorCode, type ErrorCodeValue } from '@twinzy/shared';
