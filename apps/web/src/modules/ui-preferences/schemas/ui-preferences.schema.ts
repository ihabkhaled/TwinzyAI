import { z } from '@/packages/zod';
import { AppDirection } from '@/shared/enums/app-direction.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

/**
 * Persisted UI-preferences snapshot: the two user-controllable presentation
 * settings that are mirrored onto the document root (<html>) — the color theme
 * and the writing direction. Every read from browser storage is validated
 * against this schema so a corrupt, stale, or hand-edited value can never reach
 * the store.
 */
export const uiPreferencesSnapshotSchema = z.object({
  theme: z.enum([AppTheme.Light, AppTheme.Dark, AppTheme.System]),
  direction: z.enum([AppDirection.Ltr, AppDirection.Rtl]),
});

export type UiPreferencesSnapshot = z.infer<typeof uiPreferencesSnapshotSchema>;
