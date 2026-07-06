import type { ReactElement } from 'react';

import { Card, CardTitle, Stack } from '@/packages/ui-primitives';

import type { GameIntroProps } from '../model/game-component.types';

import { gameIntroListClass } from './game-intro.variants';

/** "How it works" card. Step items are prepared upstream and passed as children. */
export function GameIntro({ title, children, testId }: Readonly<GameIntroProps>): ReactElement {
  return (
    <Card testId={testId}>
      <Stack gap="sm">
        <CardTitle>{title}</CardTitle>
        <ol className={gameIntroListClass}>{children}</ol>
      </Stack>
    </Card>
  );
}
