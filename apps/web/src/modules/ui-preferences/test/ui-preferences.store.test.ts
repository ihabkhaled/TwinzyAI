import { afterEach, describe, expect, it } from 'vitest';

import { AppTheme } from '@/shared/enums/app-theme.enum';

import { useUiPreferencesStore } from '../store/ui-preferences.store';

const initialState = useUiPreferencesStore.getState();

describe('useUiPreferencesStore', () => {
  afterEach(() => {
    useUiPreferencesStore.setState(initialState, true);
  });

  it('defaults to the system theme and un-hydrated state', () => {
    const state = useUiPreferencesStore.getState();

    expect(state.theme).toBe(AppTheme.System);
    expect(state.hasHydrated).toBe(false);
  });

  it('updates the theme via setTheme', () => {
    useUiPreferencesStore.getState().setTheme(AppTheme.Dark);

    expect(useUiPreferencesStore.getState().theme).toBe(AppTheme.Dark);
  });

  it('applies the snapshot and marks hydration complete', () => {
    useUiPreferencesStore.getState().hydrate({
      theme: AppTheme.Light,
    });

    const state = useUiPreferencesStore.getState();

    expect(state.hasHydrated).toBe(true);
    expect(state.theme).toBe(AppTheme.Light);
  });
});
