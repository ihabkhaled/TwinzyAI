import { z } from '@/packages/zod';
import { AppTheme } from '@/shared/enums/app-theme.enum';

/**
 * Persisted color-theme preference. Direction is derived only from the locale
 * and is deliberately absent so storage cannot contradict the locale cookie.
 */
export const uiPreferencesSnapshotSchema = z.strictObject({
  theme: z.enum([AppTheme.Light, AppTheme.Dark, AppTheme.System]),
});

export type UiPreferencesSnapshot = z.infer<typeof uiPreferencesSnapshotSchema>;
