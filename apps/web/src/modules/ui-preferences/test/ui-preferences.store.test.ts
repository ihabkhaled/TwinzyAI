import { afterEach, describe, expect, it } from 'vitest';

import { AppDirection } from '@/shared/enums/app-direction.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import { useUiPreferencesStore } from '../store/ui-preferences.store';

const initialState = useUiPreferencesStore.getState();

describe('useUiPreferencesStore', () => {
  afterEach(() => {
    useUiPreferencesStore.setState(initialState, true);
  });

  it('defaults to the system theme, ltr direction, and un-hydrated state', () => {
    const state = useUiPreferencesStore.getState();

    expect(state.theme).toBe(AppTheme.System);
    expect(state.direction).toBe(AppDirection.Ltr);
    expect(state.hasHydrated).toBe(false);
  });

  it('updates the theme via setTheme', () => {
    useUiPreferencesStore.getState().setTheme(AppTheme.Dark);

    expect(useUiPreferencesStore.getState().theme).toBe(AppTheme.Dark);
  });

  it('updates the direction via setDirection', () => {
    useUiPreferencesStore.getState().setDirection(AppDirection.Rtl);

    expect(useUiPreferencesStore.getState().direction).toBe(AppDirection.Rtl);
  });

  it('applies the snapshot and marks hydration complete', () => {
    useUiPreferencesStore.getState().hydrate({
      theme: AppTheme.Light,
      direction: AppDirection.Rtl,
    });

    const state = useUiPreferencesStore.getState();

    expect(state.hasHydrated).toBe(true);
    expect(state.theme).toBe(AppTheme.Light);
    expect(state.direction).toBe(AppDirection.Rtl);
  });
});
