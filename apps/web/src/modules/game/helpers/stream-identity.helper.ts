import { randomUuid } from '@/packages/browser';
import { readStorageJson, writeStorageJson } from '@/packages/storage';
import { z } from '@/packages/zod';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';

const TabIdSchema = z.uuid();

/**
 * A stable per-browser-tab id, minted once and kept in sessionStorage (per-tab,
 * survives reload, not shared across tabs). Sent with every streaming analyze
 * request so the backend can scope its per-tab concurrency cap and stamp each
 * frame for this tab. Reads/writes go through the storage wrapper, never
 * sessionStorage directly.
 */
export const getTabId = (): string => {
  const existing = readStorageJson('session', STORAGE_KEYS.tabId, TabIdSchema);
  if (existing !== null) {
    return existing;
  }
  const tabId = randomUuid();
  writeStorageJson('session', STORAGE_KEYS.tabId, tabId);
  return tabId;
};

/** A fresh correlation id for one analyze run. */
export const newRequestId = (): string => randomUuid();
