import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppTranslation } from '@/packages/i18n';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import { LocaleSwitcher } from '../containers/locale-switcher.container';
import { useLocaleSwitcher } from '../hooks/useLocaleSwitcher.hook';

vi.mock('@/packages/i18n', async (importActual) => ({
  ...(await importActual()),
  useAppTranslation: vi.fn(),
}));
vi.mock('../hooks/useLocaleSwitcher.hook', () => ({ useLocaleSwitcher: vi.fn() }));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    vi.mocked(useAppTranslation).mockReturnValue(((key: string) => key) as never);
    vi.mocked(useLocaleSwitcher).mockReturnValue({
      activeLocale: 'en',
      isSwitchingLocale: false,
      onSelectLocale: vi.fn(),
    });
  });

  it('disables the selector and renders an accessible loader while switching', () => {
    vi.mocked(useLocaleSwitcher).mockReturnValue({
      activeLocale: 'en',
      isSwitchingLocale: true,
      onSelectLocale: vi.fn(),
    });

    render(<LocaleSwitcher />);

    expect(screen.getByTestId(TEST_IDS.localeSwitch)).toBeDisabled();
    expect(screen.getByTestId(TEST_IDS.localeSwitchLoader)).toHaveRole('status');
  });

  it('keeps the selector enabled and hides the loader when idle', () => {
    render(<LocaleSwitcher />);

    expect(screen.getByTestId(TEST_IDS.localeSwitch)).toBeEnabled();
    expect(screen.queryByTestId(TEST_IDS.localeSwitchLoader)).not.toBeInTheDocument();
  });
});
