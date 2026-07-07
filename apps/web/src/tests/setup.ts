import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

// jsdom does not implement object URLs; the upload flow depends on them.
// Exported so tests can assert create/revoke without unbound-method refs.
let objectUrlCounter = 0;

export const objectUrlMocks = {
  create: vi.fn(() => {
    objectUrlCounter += 1;
    return `blob:mock-${objectUrlCounter}`;
  }),
  revoke: vi.fn(),
};

Object.assign(URL, {
  createObjectURL: objectUrlMocks.create,
  revokeObjectURL: objectUrlMocks.revoke,
});

// jsdom does not implement matchMedia; the ui-preferences effects call it to
// resolve `system` theme and subscribe to OS scheme changes. Return a stable,
// non-matching MediaQueryList so mounting those effects never throws.
const createMediaQueryList = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(() => false),
});

if (typeof globalThis.matchMedia !== 'function') {
  Object.assign(globalThis, { matchMedia: vi.fn(createMediaQueryList) });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
