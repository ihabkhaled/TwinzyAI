/**
 * UI theme selection. `System` defers to the OS `prefers-color-scheme`.
 * As-const object plus derived type — TypeScript `enum` is banned repo-wide.
 */
export const AppTheme = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type AppThemeValue = (typeof AppTheme)[keyof typeof AppTheme];
