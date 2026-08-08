import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getServerLocale } from '@/packages/i18n';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';

import { buildCurrentLocaleAlternates } from './server-locale-route.helper';

vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual()),
  getServerLocale: vi.fn(),
}));

describe('buildCurrentLocaleAlternates', () => {
  beforeEach(() => {
    vi.mocked(getServerLocale).mockReset();
  });

  it('builds canonical and hreflang URLs for the active supported locale', async () => {
    vi.mocked(getServerLocale).mockResolvedValue('ar');

    await expect(buildCurrentLocaleAlternates(ROUTE_PATHS.about)).resolves.toMatchObject({
      canonical: '/ar/about',
      languages: { en: '/en/about', ar: '/ar/about' },
    });
  });

  it('falls back safely and canonicalizes the English homepage to root', async () => {
    vi.mocked(getServerLocale).mockResolvedValue('unknown');

    await expect(buildCurrentLocaleAlternates(ROUTE_PATHS.home)).resolves.toMatchObject({
      canonical: '/',
      languages: { en: '/', 'x-default': '/' },
    });
  });
});
