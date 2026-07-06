import type { ReactElement } from 'react';

import type { VisuallyHiddenProps } from '../types/shared-component.types';

/**
 * Renders content that is removed from the visual layout but still available to
 * screen readers (the Tailwind `sr-only` pattern). Used for accessible labels
 * and off-screen announcements.
 */
export function VisuallyHidden({ children }: Readonly<VisuallyHiddenProps>): ReactElement {
  return <span className="sr-only">{children}</span>;
}
