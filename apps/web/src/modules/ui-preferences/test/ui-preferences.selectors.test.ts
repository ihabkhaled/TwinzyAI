import { describe, expect, it, vi } from 'vitest';

import { AppDirection } from '@/shared/enums/app-direction.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import {
  selectDirection,
  selectPreferencesSnapshot,
  selectTheme,
} from '../store/ui-preferences.selectors';
import type { UiPreferencesState } from '../types/ui-preferences.types';

const state: UiPreferencesState = {
  theme: AppTheme.Dark,
  direction: AppDirection.Rtl,
  hasHydrated: true,
  setTheme: vi.fn(),
  setDirection: vi.fn(),
  hydrate: vi.fn(),
};

describe('ui-preferences selectors', () => {
  it('selects the theme', () => {
    expect(selectTheme(state)).toBe(AppTheme.Dark);
  });

  it('selects the direction', () => {
    expect(selectDirection(state)).toBe(AppDirection.Rtl);
  });

  it('selects the persisted snapshot without store internals', () => {
    expect(selectPreferencesSnapshot(state)).toStrictEqual({
      theme: AppTheme.Dark,
      direction: AppDirection.Rtl,
    });
  });
});
