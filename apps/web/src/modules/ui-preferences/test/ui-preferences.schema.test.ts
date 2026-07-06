import { describe, expect, it } from 'vitest';

import { AppDirection } from '@/shared/enums/app-direction.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import { uiPreferencesSnapshotSchema } from '../schemas/ui-preferences.schema';

describe('uiPreferencesSnapshotSchema', () => {
  it('parses a valid snapshot', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: AppTheme.Dark,
      direction: AppDirection.Rtl,
    });

    expect(result.success).toBe(true);
  });

  it('accepts the system theme', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: AppTheme.System,
      direction: AppDirection.Ltr,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown theme value', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: 'sepia',
      direction: AppDirection.Ltr,
    });

    expect(result.success).toBe(false);
  });

  it('rejects a missing direction', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({ theme: AppTheme.System });

    expect(result.success).toBe(false);
  });
});
