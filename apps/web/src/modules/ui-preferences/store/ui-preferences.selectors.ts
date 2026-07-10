import type { AppThemeValue } from '@/shared/enums/app-theme.enum';

import type { UiPreferencesState } from '../types/ui-preferences.types';

/** Select the active theme preference. */
export const selectTheme = (state: UiPreferencesState): AppThemeValue => state.theme;
