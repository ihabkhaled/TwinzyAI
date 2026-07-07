import { afterEach, describe, expect, it } from 'vitest';

import { removeStorageItem } from '@/packages/storage';

import { getTabId, newRequestId } from '../helpers/stream-identity.helper';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

describe('stream identity helpers', () => {
  afterEach(() => {
    removeStorageItem('session', 'twinzy.tabId');
  });

  it('mints a stable per-tab id and reuses it on later reads', () => {
    const first = getTabId();
    const second = getTabId();

    expect(first).toMatch(UUID_PATTERN);
    expect(second).toBe(first);
  });

  it('mints a fresh request id on each call', () => {
    expect(newRequestId()).toMatch(UUID_PATTERN);
    expect(newRequestId()).not.toBe(newRequestId());
  });
});
