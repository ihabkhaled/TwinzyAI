import type { AppDirectionValue } from '@/shared/enums/app-direction.enum';
import type { AppThemeValue } from '@/shared/enums/app-theme.enum';

import type { UiPreferencesSnapshot } from '../schemas/ui-preferences.schema';
import type { UiPreferencesState } from '../types/ui-preferences.types';

/** Select the persisted subset of preferences (theme + direction). */
export const selectPreferencesSnapshot = (state: UiPreferencesState): UiPreferencesSnapshot => ({
  theme: state.theme,
  direction: state.direction,
});

/** Select the active theme preference. */
export const selectTheme = (state: UiPreferencesState): AppThemeValue => state.theme;

/** Select the active writing direction. */
export const selectDirection = (state: UiPreferencesState): AppDirectionValue => state.direction;
