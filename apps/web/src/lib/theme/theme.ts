import { readStoredValue, writeStoredValue } from '../storage/local-storage';

export const Theme = {
  Light: 'light',
  Dark: 'dark',
} as const;

export type ThemeValue = (typeof Theme)[keyof typeof Theme];

const STORAGE_KEY = 'twinzy-theme';

const THEME_ATTRIBUTE = 'data-theme';

export const readStoredTheme = (): ThemeValue | undefined => {
  const stored = readStoredValue(STORAGE_KEY);
  return stored === Theme.Light || stored === Theme.Dark ? stored : undefined;
};

export const resolveCurrentTheme = (): ThemeValue => {
  const stored = readStoredTheme();
  if (stored !== undefined) {
    return stored;
  }
  const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? Theme.Dark : Theme.Light;
};

export const applyTheme = (theme: ThemeValue): void => {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  writeStoredValue(STORAGE_KEY, theme);
};

export const toggleTheme = (): ThemeValue => {
  const next = resolveCurrentTheme() === Theme.Dark ? Theme.Light : Theme.Dark;
  applyTheme(next);
  return next;
};
