/**
 * Type guard that narrows away `null` and `undefined`. Useful as a filter
 * predicate to get a `T[]` from a `(T | null | undefined)[]` without a cast.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
