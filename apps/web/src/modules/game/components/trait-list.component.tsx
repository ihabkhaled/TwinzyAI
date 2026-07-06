import type { ReactElement } from 'react';

import { Card, CardTitle, Stack } from '@/packages/ui-primitives';

import type { TraitListProps } from '../model/game-component.types';

import { traitGridClass } from './trait-list.variants';

/** Panel that frames the extracted visible traits; rows arrive as children. */
export function TraitList({ title, children, testId }: Readonly<TraitListProps>): ReactElement {
  return (
    <Card testId={testId}>
      <Stack gap="sm">
        <CardTitle>{title}</CardTitle>
        <ul className={traitGridClass}>{children}</ul>
      </Stack>
    </Card>
  );
}
