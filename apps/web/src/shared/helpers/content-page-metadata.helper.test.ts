import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getServerLocale, getServerTranslations } from '@/packages/i18n';
import { ROUTE_PATHS } from '@/shared/constants/route-paths.constants';

import { buildContentPageMetadata } from './content-page-metadata.helper';

vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual()),
  getServerLocale: vi.fn(),
  getServerTranslations: vi.fn(),
}));

describe('buildContentPageMetadata', () => {
  beforeEach(() => {
    vi.mocked(getServerLocale).mockReset();
    vi.mocked(getServerTranslations).mockReset();
    vi.mocked(getServerTranslations).mockResolvedValue((() => 'Twinzy') as never);
  });

  it('composes the title, description, canonical alternates, and matching social metadata', async () => {
    vi.mocked(getServerLocale).mockResolvedValue('ar');

    const metadata = await buildContentPageMetadata({
      path: ROUTE_PATHS.about,
      title: 'About',
      description: 'Who Twinzy is.',
    });

    expect(metadata.title).toBe('About · Twinzy');
    expect(metadata.description).toBe('Who Twinzy is.');
    expect(metadata.alternates).toMatchObject({ canonical: '/ar/about' });
    expect(metadata.openGraph).toMatchObject({
      title: 'About · Twinzy',
      description: 'Who Twinzy is.',
      siteName: 'Twinzy',
      locale: 'ar_EG',
      url: '/ar/about',
    });
    expect(metadata.twitter).toStrictEqual({
      card: 'summary_large_image',
      title: 'About · Twinzy',
      description: 'Who Twinzy is.',
    });
  });

  it('falls back to the default locale when none is resolved', async () => {
    vi.mocked(getServerLocale).mockResolvedValue('not-a-locale');

    const metadata = await buildContentPageMetadata({
      path: ROUTE_PATHS.home,
      title: 'Home',
      description: 'The homepage.',
    });

    expect(metadata.alternates).toMatchObject({ canonical: '/' });
    expect(metadata.openGraph).toMatchObject({ locale: 'en_US' });
  });
});
