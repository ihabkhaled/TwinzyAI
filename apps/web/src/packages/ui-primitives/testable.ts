/**
 * Shared test-hook contract for every design-system primitive. Consumers pass
 * a semantic `testId`; the primitive forwards it to the DOM as `data-testid`,
 * matching the repo-wide component convention (see the `testId` allowance in
 * the frontend `no-raw-i18n-text` rule).
 */
export interface Testable {
  testId?: string | undefined;
}
