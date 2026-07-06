import type { ReactElement } from 'react';

import type { SkipLinkProps } from '../types/shared-component.types';

import { skipLinkClassName } from './skip-link.variants';

/**
 * Keyboard "skip to content" link. Hidden until focused, then jumps to the
 * given in-page target. Pure presentation: the target and translated label are
 * supplied as props; the reveal/focus styling lives in the variants file.
 */
export function SkipLink({ targetHref, label }: Readonly<SkipLinkProps>): ReactElement {
  return (
    <a className={skipLinkClassName} href={targetHref}>
      {label}
    </a>
  );
}
