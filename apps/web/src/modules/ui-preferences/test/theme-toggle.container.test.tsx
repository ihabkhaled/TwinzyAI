import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppTranslation } from '@/packages/i18n';
import { TEST_IDS } from '@/shared/constants/test-ids.constants';
import { AppTheme } from '@/shared/enums/app-theme.enum';

import { ThemeToggle } from '../containers/theme-toggle.container';
import { useThemeToggle } from '../hooks/useThemeToggle.hook';

vi.mock('@/packages/i18n', () => ({ useAppTranslation: vi.fn() }));
vi.mock('../hooks/useThemeToggle.hook', () => ({ useThemeToggle: vi.fn() }));

const echoTranslate = (key: string): string => key;
const useThemeToggleMock = vi.mocked(useThemeToggle);
const onToggleTheme = vi.fn();

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeToggleMock.mockReset();
    onToggleTheme.mockReset();
    vi.mocked(useAppTranslation).mockReturnValue(echoTranslate as never);
  });

  it('keeps aria-pressed stable when dark mode resolves before hydration', () => {
    useThemeToggleMock.mockReturnValue({
      theme: AppTheme.System,
      isDark: true,
      hasHydrated: false,
      onToggleTheme,
    });

    render(<ThemeToggle />);

    expect(screen.getByTestId(TEST_IDS.themeToggle)).toHaveAttribute('aria-pressed', 'false');
  });

  it('exposes the resolved dark state after hydration', () => {
    useThemeToggleMock.mockReturnValue({
      theme: AppTheme.Dark,
      isDark: true,
      hasHydrated: true,
      onToggleTheme,
    });

    render(<ThemeToggle />);

    expect(screen.getByTestId(TEST_IDS.themeToggle)).toHaveAttribute('aria-pressed', 'true');
  });
});
