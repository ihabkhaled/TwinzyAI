/**
 * Document writing direction. As-const object plus derived type — TypeScript
 * `enum` is banned repo-wide.
 */
export const AppDirection = {
  Ltr: 'ltr',
  Rtl: 'rtl',
} as const;

export type AppDirectionValue = (typeof AppDirection)[keyof typeof AppDirection];
