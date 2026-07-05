/**
 * The only wrapper allowed to touch browser storage. Image data must NEVER
 * pass through here — storage is for small UI preferences only, enforced
 * by a size guard.
 */
const MAX_VALUE_LENGTH = 256;

export const readStoredValue = (key: string): string | undefined => {
  try {
    const value = globalThis.localStorage.getItem(key);
    return value ?? undefined;
  } catch {
    return undefined;
  }
};

export const writeStoredValue = (key: string, value: string): void => {
  if (value.length > MAX_VALUE_LENGTH) {
    return;
  }
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode) — preferences just do not persist.
  }
};
