import type { ReactNode } from 'react';

import { Card } from '@/components/ui';
import { t } from '@/i18n';

import type { TraitView } from '../model/game.types';

import { TraitItem } from './TraitItem';

interface TraitListProps {
  traits: TraitView[];
}

export const TraitList = ({ traits }: TraitListProps): ReactNode => (
  <Card>
    <h2 className="mb-3 text-xl font-semibold">{t('game.traitsTitle')}</h2>
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {traits.map((trait) => (
        <TraitItem key={trait.key} trait={trait} />
      ))}
    </ul>
  </Card>
);
