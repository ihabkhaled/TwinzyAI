import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppTheme } from '@/shared/enums/app-theme.enum';

import { useThemeToggle } from '../hooks/useThemeToggle.hook';
import { useUiPreferencesStore } from '../store/ui-preferences.store';

const initialState = useUiPreferencesStore.getState();

afterEach(() => {
  useUiPreferencesStore.setState(initialState, true);
});

describe('useThemeToggle', () => {
  it('reports hydration and toggles dark to light', () => {
    useUiPreferencesStore.setState({ theme: AppTheme.Dark, hasHydrated: true });
    const { result } = renderHook(() => useThemeToggle());

    expect(result.current.isDark).toBe(true);
    expect(result.current.hasHydrated).toBe(true);
    act(() => {
      result.current.onToggleTheme();
    });
    expect(useUiPreferencesStore.getState().theme).toBe(AppTheme.Light);
  });

  it('toggles light to dark', () => {
    useUiPreferencesStore.setState({ theme: AppTheme.Light, hasHydrated: true });
    const { result } = renderHook(() => useThemeToggle());

    act(() => {
      result.current.onToggleTheme();
    });
    expect(useUiPreferencesStore.getState().theme).toBe(AppTheme.Dark);
  });
});
