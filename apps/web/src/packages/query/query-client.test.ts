import { describe, expect, it } from 'vitest';

import { makeQueryClient } from './query-client';

describe('makeQueryClient', () => {
  it('applies the app default query and mutation options', () => {
    const defaults = makeQueryClient().getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(300_000);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(0);
  });
});
