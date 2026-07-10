import { describe, expect, it, vi } from 'vitest';

import { getRootAttribute, matchesMediaQuery } from '@/packages/browser';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import { resolveInitialTheme, resolveThemeAttribute } from '../model/ui-preferences.constants';

vi.mock('@/packages/browser', () => ({
  getRootAttribute: vi.fn(),
  matchesMediaQuery: vi.fn(),
}));

describe('resolveThemeAttribute', () => {
  it('returns light for the explicit light preference', () => {
    expect(resolveThemeAttribute(AppTheme.Light)).toBe(AppTheme.Light);
  });

  it('returns dark for the explicit dark preference', () => {
    expect(resolveThemeAttribute(AppTheme.Dark)).toBe(AppTheme.Dark);
  });

  it('resolves system to dark when the OS prefers dark', () => {
    vi.mocked(matchesMediaQuery).mockReturnValue(true);

    expect(resolveThemeAttribute(AppTheme.System)).toBe(AppTheme.Dark);
  });

  it('resolves system to light when the OS does not prefer dark', () => {
    vi.mocked(matchesMediaQuery).mockReturnValue(false);

    expect(resolveThemeAttribute(AppTheme.System)).toBe(AppTheme.Light);
  });
});

describe('resolveInitialTheme', () => {
  it('adopts dark from the server-rendered data-theme attribute (theme cookie present)', () => {
    vi.mocked(getRootAttribute).mockReturnValue(AppTheme.Dark);

    expect(resolveInitialTheme(AppTheme.System)).toBe(AppTheme.Dark);
  });

  it('keeps the in-store default when the server rendered light', () => {
    vi.mocked(getRootAttribute).mockReturnValue(AppTheme.Light);

    expect(resolveInitialTheme(AppTheme.System)).toBe(AppTheme.System);
  });

  it('keeps the in-store default when no data-theme attribute is present', () => {
    vi.mocked(getRootAttribute).mockReturnValue(null);

    expect(resolveInitialTheme(AppTheme.Light)).toBe(AppTheme.Light);
  });
});
