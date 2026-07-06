/**
 * Namespaced, versioned browser-storage keys. Versioning the suffix (`.v1`)
 * lets a future preferences shape be migrated without colliding with values
 * written by an older client.
 */
export const STORAGE_KEYS = {
  uiPreferences: 'twinzy.ui-preferences.v1',
} as const;

export type AppStorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
