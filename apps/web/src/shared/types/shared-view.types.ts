import type { ReactNode } from 'react';

/** Mixin for any component that accepts an optional `data-testid` handle. */
export interface WithTestId {
  testId?: string;
}

/** Mixin for any component that renders arbitrary children. */
export interface WithChildren {
  children: ReactNode;
}
