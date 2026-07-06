import { describe, expect, it, vi } from 'vitest';

import { getRootAttribute, matchesMediaQuery } from '@/packages/browser';
import { AppDirection } from '@/shared/enums/app-direction.enum';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import { resolveInitialDirection, resolveThemeAttribute } from '../model/ui-preferences.constants';

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

describe('resolveInitialDirection', () => {
  it('adopts rtl from the server-rendered dir attribute', () => {
    vi.mocked(getRootAttribute).mockReturnValue(AppDirection.Rtl);

    expect(resolveInitialDirection()).toBe(AppDirection.Rtl);
  });

  it('falls back to ltr when no dir attribute is present', () => {
    vi.mocked(getRootAttribute).mockReturnValue(null);

    expect(resolveInitialDirection()).toBe(AppDirection.Ltr);
  });

  it('falls back to ltr for an unrecognized dir attribute', () => {
    vi.mocked(getRootAttribute).mockReturnValue('sideways');

    expect(resolveInitialDirection()).toBe(AppDirection.Ltr);
  });
});
