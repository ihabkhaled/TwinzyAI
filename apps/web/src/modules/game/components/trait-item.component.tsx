import type { ReactElement } from 'react';

import type { TraitItemProps } from '../model/game-component.types';

import { traitItemClass, traitItemLabelClass, traitItemValueClass } from './trait-item.variants';

/** One visible-trait row: a label above its extracted value. */
export function TraitItem({ label, value, testId }: Readonly<TraitItemProps>): ReactElement {
  return (
    <li className={traitItemClass} data-testid={testId}>
      <span className={traitItemLabelClass}>{label}</span>
      <span className={traitItemValueClass}>{value}</span>
    </li>
  );
}
