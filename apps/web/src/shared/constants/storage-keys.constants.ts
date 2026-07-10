/**
 * Namespaced, versioned browser-storage keys. Versioning the suffix (`.v1`)
 * lets a future preferences shape be migrated without colliding with values
 * written by an older client.
 */
export const STORAGE_KEYS = {
  uiPreferences: 'twinzy.ui-preferences.v1',
  /** Per-tab uuid in sessionStorage; unversioned — the value is a plain uuid with no shape to migrate. */
  tabId: 'twinzy.tabId',
} as const;
