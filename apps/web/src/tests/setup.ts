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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
