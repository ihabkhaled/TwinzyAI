import type { ReactElement } from 'react';

import { SparklesIcon } from '@/packages/icons';

import type { AppHeaderProps } from '../types/shared-component.types';

import {
  appHeaderBrandClass,
  appHeaderClass,
  appHeaderControlsClass,
  appHeaderInnerClass,
} from './app-header.variants';

/**
 * Sticky app top bar: the brand on one side and a slot for preference controls
 * (language + theme) on the other. Pure composition — the controls are passed
 * in as children by the layout so this shared component stays feature-agnostic.
 */
export function AppHeader({ brandLabel, children }: Readonly<AppHeaderProps>): ReactElement {
  return (
    <header className={appHeaderClass}>
      <div className={appHeaderInnerClass}>
        <span className={appHeaderBrandClass}>
          <SparklesIcon aria-hidden size={20} />
          {brandLabel}
        </span>
        <div className={appHeaderControlsClass}>{children}</div>
      </div>
    </header>
  );
}
