import { describe, expect, it, vi } from 'vitest';

import { AppTheme } from '@/shared/enums/app-theme.enum';

import { selectTheme } from '../store/ui-preferences.selectors';
import type { UiPreferencesState } from '../types/ui-preferences.types';

const state: UiPreferencesState = {
  theme: AppTheme.Dark,
  hasHydrated: true,
  setTheme: vi.fn(),
  hydrate: vi.fn(),
};

describe('ui-preferences selectors', () => {
  it('selects the theme', () => {
    expect(selectTheme(state)).toBe(AppTheme.Dark);
  });
});
