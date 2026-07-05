import type { ReactNode } from 'react';

import type { TraitView } from '../model/game.types';

interface TraitItemProps {
  trait: TraitView;
}

export const TraitItem = ({ trait }: TraitItemProps): ReactNode => (
  <li className="flex flex-col gap-0.5 rounded-lg bg-surface-muted px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
      {trait.label}
    </span>
    <span className="text-sm">{trait.value}</span>
  </li>
);
