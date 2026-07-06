/**
 * Derive a per-item test id from a base id and a stable suffix (an index or a
 * key), e.g. `result-card` + `2` -> `result-card-2`. Keeps list-item test ids
 * consistent across the app and its test suites.
 */
export function buildIndexedTestId(base: string, suffix: string | number): string {
  return `${base}-${suffix}`;
}
