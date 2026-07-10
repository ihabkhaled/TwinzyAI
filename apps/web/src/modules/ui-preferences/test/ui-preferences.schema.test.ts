import { describe, expect, it } from 'vitest';

import { AppTheme } from '@/shared/enums/app-theme.enum';

import { uiPreferencesSnapshotSchema } from '../schemas/ui-preferences.schema';

describe('uiPreferencesSnapshotSchema', () => {
  it('parses a valid snapshot', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: AppTheme.Dark,
    });

    expect(result.success).toBe(true);
  });

  it('accepts the system theme', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: AppTheme.System,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown theme value', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: 'sepia',
    });

    expect(result.success).toBe(false);
  });

  it('rejects stale direction data instead of persisting a second locale source', () => {
    const result = uiPreferencesSnapshotSchema.safeParse({
      theme: AppTheme.System,
      direction: 'rtl',
    });

    expect(result.success).toBe(false);
  });
});
