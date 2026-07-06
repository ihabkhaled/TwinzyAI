import { getSafeWindow } from '@/packages/browser';
import { appLogger } from '@/packages/logger';
import { safeParseSchema, type z } from '@/packages/zod';

export type StorageArea = 'local' | 'session';

function resolveStorage(area: StorageArea): Storage | null {
  const safeWindow = getSafeWindow();

  if (safeWindow === null) {
    return null;
  }

  return area === 'local' ? safeWindow.localStorage : safeWindow.sessionStorage;
}

function parseJsonValue(raw: string): unknown {
  return JSON.parse(raw) as unknown;
}

/**
 * Reads and schema-validates a JSON value from web storage. Returns `null`
 * (and logs a warning) when the slot is empty, holds malformed JSON, or holds
 * a value that does not match the schema — callers never see corrupt state.
 */
export function readStorageJson<TSchema extends z.ZodType>(
  area: StorageArea,
  key: string,
  schema: TSchema,
): z.output<TSchema> | null {
  const storage = resolveStorage(area);

  if (storage === null) {
    return null;
  }

  const raw = storage.getItem(key);

  if (raw === null) {
    return null;
  }

  let candidate: unknown;

  try {
    candidate = parseJsonValue(raw);
  } catch {
    appLogger.warn('storage.read.invalid-json', { area, key });

    return null;
  }

  const result = safeParseSchema(schema, candidate);

  if (!result.success) {
    appLogger.warn('storage.read.invalid-shape', { area, key, issues: result.issues });

    return null;
  }

  return result.data;
}

export function writeStorageJson(area: StorageArea, key: string, value: unknown): boolean {
  const storage = resolveStorage(area);

  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(key, JSON.stringify(value));

    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(area: StorageArea, key: string): void {
  const storage = resolveStorage(area);

  if (storage === null) {
    return;
  }

  storage.removeItem(key);
}
